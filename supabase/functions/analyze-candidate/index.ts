import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const FUNCTION_NAME = "analyze-candidate";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed UUID for Talent Bank job
const TALENT_BANK_JOB_ID = "00000000-0000-0000-0000-000000000001";

const ANALYSIS_PROMPT = `Você é o Diretor de Recursos Humanos. Analise a aderência do candidato à vaga usando:

## Metodologia de Avaliação
1. **CHA** - Conhecimentos, Habilidades e Atitudes baseado em evidências
2. **Método STAR** - Situação, Tarefa, Ação, Resultado
3. **Perfil Comportamental DISC** - Aderência cultural

## Regra Obrigatória de Seleção do Descritivo da Vaga
O descritivo de cargo que DEVE ser utilizado como base da avaliação é aquele presente na tabela "Descritivo de Vagas".
Para candidatos do Banco de Talentos, o descritivo correto é a concatenação de: Cargo Pretendido + Senioridade.

## Critérios de Pontuação OBRIGATÓRIOS
- **0-30**: Sem experiência relevante, perfil desalinhado
- **31-50**: Pouca experiência, atende <30% dos requisitos
- **51-65**: Experiência parcial, atende 30-50% dos requisitos
- **66-75**: Boa experiência, atende 50-70% dos requisitos
- **76-85**: Muito qualificado, atende 70-90% dos requisitos
- **86-100**: Excepcional, atende >90% + diferenciais

IMPORTANTE: 
- Se houver informações do currículo, analise em detalhe
- Compare CADA requisito da vaga com as evidências do currículo
- Seja RIGOROSO - notas altas apenas com evidências concretas

## Formato de Resposta OBRIGATÓRIO
Retorne APENAS JSON válido:
{
  "nota_aderencia": <número 0-100>,
  "relatorio_detalhado": "<relatório com: Resumo Geral, Avaliação Técnica, Avaliação Comportamental, Fit Cultural, Match com Vaga, Riscos, Recomendação Final>"
}`;

async function validateAuth(
  req: Request,
  supabaseAdmin: SupabaseClient
): Promise<{ userId: string; error: Response | null; isServiceRole: boolean }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      userId: "",
      isServiceRole: false,
      error: new Response(
        JSON.stringify({ error: "Unauthorized", detail: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    console.log(`[${FUNCTION_NAME}] Authenticated via service role key (internal call)`);
    return { userId: "service-role", isServiceRole: true, error: null };
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return {
      userId: "",
      isServiceRole: false,
      error: new Response(
        JSON.stringify({ error: "Unauthorized", detail: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userId = user.id;
  const orgAuth = await checkOrgRole(supabaseAdmin, userId, ["admin", "people"]);
  
  if (!orgAuth.authorized) {
    return {
      userId: "",
      isServiceRole: false,
      error: new Response(
        JSON.stringify({ error: "Forbidden", detail: "Requires admin or people role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  return { userId, isServiceRole: false, error: null };
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[${FUNCTION_NAME}][${requestId}] Start`);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { userId, error: authError, isServiceRole } = await validateAuth(req, supabaseAdmin);
  if (authError) return authError;

  if (!isServiceRole) {
    const rlKey = getRateLimitKey(req, userId);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;
  }

  try {
    const { candidateEmail, jobId, jobData, candidateData, profilerResult, resumeUrl, desiredPosition, desiredSeniority } = await req.json();

    // Mark as "processing"
    await supabaseAdmin
      .from("job_applications")
      .update({ ai_analysis_status: 'processing' })
      .eq("candidate_email", candidateEmail)
      .eq("job_id", jobId);

    // Check for LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(`[${FUNCTION_NAME}][${requestId}] LOVABLE_API_KEY not configured`);
      return new Response(
        JSON.stringify({
          nota_aderencia: null,
          relatorio_detalhado: "Integração com IA não configurada. LOVABLE_API_KEY ausente.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For Talent Bank, fetch job description from job_descriptions table
    let effectiveJobData = jobData;
    if (jobId === TALENT_BANK_JOB_ID && desiredPosition && desiredSeniority) {
      const { data: jobDesc, error: jobDescError } = await supabaseAdmin
        .from("job_descriptions")
        .select("description, requirements")
        .eq("position_type", desiredPosition)
        .eq("seniority", desiredSeniority)
        .single();

      if (jobDescError) {
        console.warn(`[${FUNCTION_NAME}][${requestId}] Job description not found`);
      } else if (jobDesc) {
        effectiveJobData = {
          title: `${desiredPosition} - ${desiredSeniority}`,
          description: jobDesc.description,
          requirements: jobDesc.requirements,
          position: { title: desiredPosition },
        };
      }
    }

    // Try to get resume text content (PDF analysis not supported via OpenAI-compatible API, use text)
    let resumeInfo = "Currículo não disponível.";
    if (resumeUrl) {
      try {
        const { data: fileData, error: fileError } = await supabaseAdmin.storage
          .from("resumes")
          .download(resumeUrl);
          
        if (fileData && !fileError) {
          // Try to extract text from the PDF (basic approach)
          const text = await fileData.text();
          if (text && text.length > 50) {
            resumeInfo = `CONTEÚDO DO CURRÍCULO:\n${text.slice(0, 8000)}`;
          } else {
            resumeInfo = "Currículo em PDF disponível mas não foi possível extrair texto.";
          }
          console.log(`[${FUNCTION_NAME}][${requestId}] Resume processed`);
        }
      } catch (err) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Error loading resume:`, err);
      }
    }

    // Build user prompt
    const textPrompt = `
=== DADOS DA VAGA ===
Título: ${effectiveJobData?.title || "N/A"}
Cargo: ${effectiveJobData?.position?.title || effectiveJobData?.positions?.title || "N/A"}
Departamento: ${effectiveJobData?.department?.name || effectiveJobData?.departments?.name || "N/A"}

DESCRIÇÃO DA VAGA:
${effectiveJobData?.description || "Não informada"}

REQUISITOS OBRIGATÓRIOS:
${effectiveJobData?.requirements || "Não informados"}

=== CANDIDATO ===
Nome: ${candidateData?.candidate_name || "N/A"}
Email: ${candidateData?.candidate_email || "N/A"}
Nascimento: ${candidateData?.candidate_birth_date || "N/A"}

=== PERFIL COMPORTAMENTAL (DISC) ===
Perfil: ${profilerResult?.profile?.name || "N/A"} (${profilerResult?.code || "N/A"})
Resumo: ${profilerResult?.profile?.summary || "N/A"}
Habilidades: ${profilerResult?.profile?.mainSkills || "N/A"}
Vantagens: ${profilerResult?.profile?.mainAdvantages || "N/A"}

=== CURRÍCULO ===
${resumeInfo}

=== INSTRUÇÕES ===
Seja RIGOROSO na pontuação baseada em evidências concretas.
Retorne o JSON com nota_aderencia e relatorio_detalhado.`;

    console.log(`[${FUNCTION_NAME}][${requestId}] Calling Lovable AI`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: textPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "candidate_analysis",
              description: "Return the candidate analysis result with score and detailed report",
              parameters: {
                type: "object",
                properties: {
                  nota_aderencia: { type: "number", description: "Score from 0-100" },
                  relatorio_detalhado: { type: "string", description: "Detailed analysis report in markdown" },
                },
                required: ["nota_aderencia", "relatorio_detalhado"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "candidate_analysis" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${FUNCTION_NAME}][${requestId}] AI gateway error: ${response.status} ${errorText}`);
      await supabaseAdmin
        .from("job_applications")
        .update({ ai_analysis_status: 'error' })
        .eq("candidate_email", candidateEmail)
        .eq("job_id", jobId);
      return new Response(JSON.stringify({ nota_aderencia: null, relatorio_detalhado: "Análise indisponível." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    
    let result = { nota_aderencia: null as number | null, relatorio_detalhado: "" };
    
    // Try to parse from tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        result.nota_aderencia = typeof parsed.nota_aderencia === 'number' ? parsed.nota_aderencia : parseInt(parsed.nota_aderencia, 10);
        result.relatorio_detalhado = parsed.relatorio_detalhado || "";
      } catch (e) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Tool call parse error:`, e);
      }
    }
    
    // Fallback: try message content
    if (!result.relatorio_detalhado) {
      const responseText = aiResponse.choices?.[0]?.message?.content || "";
      result.relatorio_detalhado = responseText;
      try {
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*"nota_aderencia"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result.nota_aderencia = typeof parsed.nota_aderencia === 'number' ? parsed.nota_aderencia : parseInt(parsed.nota_aderencia, 10);
          result.relatorio_detalhado = parsed.relatorio_detalhado || responseText;
        }
      } catch { /* keep raw text */ }
    }

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from("job_applications")
      .update({ 
        ai_score: result.nota_aderencia, 
        ai_report: result.relatorio_detalhado,
        ai_analysis_status: 'completed'
      })
      .eq("candidate_email", candidateEmail)
      .eq("job_id", jobId);

    if (updateError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] DB update error: ${updateError.message}`);
    }

    console.log(`[${FUNCTION_NAME}][${requestId}] Completed (score: ${result.nota_aderencia})`);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, error);
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.candidateEmail && body.jobId) {
        await supabaseAdmin
          .from("job_applications")
          .update({ ai_analysis_status: 'error' })
          .eq("candidate_email", body.candidateEmail)
          .eq("job_id", body.jobId);
      }
    } catch (e) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Failed to set error status:`, e);
    }
    return new Response(JSON.stringify({ nota_aderencia: null, relatorio_detalhado: "Erro na análise" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
