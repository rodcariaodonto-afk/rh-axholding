import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { getIntegrationSecret } from "../_shared/get-integration-secret.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const FUNCTION_NAME = "analyze-candidate";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
- ANALISE O CURRÍCULO PDF ANEXADO em detalhe
- Compare CADA requisito da vaga com as evidências do currículo
- Seja RIGOROSO - notas altas apenas com evidências concretas

## Formato de Resposta OBRIGATÓRIO
Retorne APENAS JSON válido:
{
  "nota_aderencia": <número 0-100>,
  "relatorio_detalhado": "<relatório com: Resumo Geral, Avaliação Técnica, Avaliação Comportamental, Fit Cultural, Match com Vaga, Riscos, Recomendação Final>"
}`;

/**
 * Validates user authentication and authorization
 * Returns user ID if valid, null otherwise
 * Also allows service role key for internal calls
 */
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
  
  // Check if this is a service role key (internal call from submit-application)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    console.log(`[${FUNCTION_NAME}] Authenticated via service role key (internal call)`);
    return { userId: "service-role", isServiceRole: true, error: null };
  }

  // Create client with user's token to validate
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

  // Check if user has admin or people role (org-scoped)
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

/**
 * Resolve organization ID from job's created_by user
 */
async function resolveOrganizationId(
  supabaseAdmin: SupabaseClient,
  jobId: string
): Promise<string | null> {
  // Get job's created_by
  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("created_by")
    .eq("id", jobId)
    .single();

  if (jobError || !job?.created_by) {
    return null;
  }

  // Use existing RPC to get user's organization
  const { data: orgId, error: orgError } = await supabaseAdmin.rpc(
    "get_user_organization",
    { _user_id: job.created_by }
  );

  if (orgError) {
    return null;
  }

  return orgId;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[${FUNCTION_NAME}][${requestId}] Start`);

  // Initialize admin client first (needed for auth validation)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // === SECURITY: Validate authentication and authorization ===
  const { userId, error: authError, isServiceRole } = await validateAuth(req, supabaseAdmin);
  if (authError) {
    return authError;
  }

  // === SECURITY: Rate limiting (SEC-007) - Skip for service role ===
  if (!isServiceRole) {
    const rlKey = getRateLimitKey(req, userId);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;
  }

  try {
    const { candidateEmail, jobId, jobData, candidateData, profilerResult, resumeUrl, desiredPosition, desiredSeniority } = await req.json();

    // Mark as "processing" BEFORE calling Anthropic
    await supabaseAdmin
      .from("job_applications")
      .update({ ai_analysis_status: 'processing' })
      .eq("candidate_email", candidateEmail)
      .eq("job_id", jobId);

    // === MULTI-TENANT: Fetch API key from Vault ===
    let ANTHROPIC_API_KEY: string | null = null;
    let apiKeySource = "none";

    // 1. Try to get from Vault by organization
    const organizationId = await resolveOrganizationId(supabaseAdmin, jobId);
    if (organizationId) {
      ANTHROPIC_API_KEY = await getIntegrationSecret(
        supabaseAdmin,
        organizationId,
        "anthropic",
        { updateLastUsed: true }
      );
      if (ANTHROPIC_API_KEY) {
        apiKeySource = "vault";
      }
    }

    // 2. Fallback to global env (transition period)
    if (!ANTHROPIC_API_KEY) {
      ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || null;
      if (ANTHROPIC_API_KEY) {
        apiKeySource = "global";
      }
    }

    // 3. No key available - return friendly error
    if (!ANTHROPIC_API_KEY) {
      console.error(`[${FUNCTION_NAME}][${requestId}] No Anthropic API key available`);
      return new Response(
        JSON.stringify({
          nota_aderencia: null,
          relatorio_detalhado: "Integração com IA não configurada. Contate o administrador.",
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

    // Download and encode PDF for Claude
    let pdfBase64 = "";
    let pdfAvailable = false;
    
    if (resumeUrl) {
      try {
        const { data: fileData, error: fileError } = await supabaseAdmin.storage
          .from("resumes")
          .download(resumeUrl);
          
        if (fileData && !fileError) {
          const arrayBuffer = await fileData.arrayBuffer();
          pdfBase64 = base64Encode(arrayBuffer);
          pdfAvailable = true;
          console.log(`[${FUNCTION_NAME}][${requestId}] PDF loaded, size: ${arrayBuffer.byteLength} bytes`);
        } else {
          console.error(`[${FUNCTION_NAME}][${requestId}] PDF download error: ${fileError?.message}`);
        }
      } catch (err) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Error loading PDF:`, err);
      }
    }

    // Build user prompt with job and candidate data
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

=== INSTRUÇÕES ===
${pdfAvailable 
  ? "ANALISE O CURRÍCULO PDF ANEXADO e compare com os requisitos da vaga."
  : "ATENÇÃO: Currículo não disponível. Avalie apenas com base no perfil comportamental."}

Seja RIGOROSO na pontuação baseada em evidências concretas.
Retorne o JSON com nota_aderencia e relatorio_detalhado.`;

    console.log(`[${FUNCTION_NAME}][${requestId}] Calling AI (pdf: ${pdfAvailable})`);

    // Build content array for Claude
    const content: unknown[] = [];
    
    if (pdfAvailable) {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: pdfBase64
        }
      });
    }
    
    content.push({
      type: "text",
      text: textPrompt
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: ANALYSIS_PROMPT,
        messages: [
          {
            role: "user",
            content
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${FUNCTION_NAME}][${requestId}] Anthropic API error: ${response.status} ${errorText}`);
      // Mark as error before returning
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
    const contentBlock = aiResponse.content?.[0];
    const responseText = contentBlock?.type === "text" ? contentBlock.text : "";
    
    console.log(`[${FUNCTION_NAME}][${requestId}] AI response length: ${responseText.length}`);

    let result = { nota_aderencia: null as number | null, relatorio_detalhado: responseText };
    try {
      // Remove markdown code blocks and find JSON object
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      // Try to find JSON object in the response
      const jsonMatch = cleaned.match(/\{[\s\S]*"nota_aderencia"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const score = typeof parsed.nota_aderencia === 'number' ? parsed.nota_aderencia : 
                     typeof parsed.nota_aderencia === 'string' ? parseInt(parsed.nota_aderencia, 10) : null;
        result = { 
          nota_aderencia: score, 
          relatorio_detalhado: parsed.relatorio_detalhado || responseText 
        };
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      const match = responseText.match(/"?nota[_\s]*ader[êe]ncia"?\s*[:\s]\s*(\d+)/i);
      if (match) {
        result.nota_aderencia = parseInt(match[1], 10);
      }
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

    console.log(`[${FUNCTION_NAME}][${requestId}] Completed (score: ${result.nota_aderencia}, source: ${apiKeySource})`);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, error);
    // Try to mark as error (best effort)
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
