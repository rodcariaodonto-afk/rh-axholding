import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const FUNCTION_NAME = "generate-position-description";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um especialista em Recursos Humanos e Engenharia de Cargos com mais de 20 anos de experiência.

Gere uma descrição profissional e detalhada para o cargo informado, incluindo:

## Estrutura Obrigatória

1. **Resumo do Cargo** (2-3 frases concisas)
2. **Objetivo Principal** (1 parágrafo descrevendo a missão do cargo)
3. **Principais Responsabilidades** (lista com 5-8 itens usando verbos de ação)
4. **Competências Comportamentais** (baseadas no perfil DISC informado, se disponível)
5. **Requisitos Técnicos Sugeridos** (habilidades técnicas típicas para o cargo)

## Diretrizes de Estilo
- Use linguagem profissional, objetiva e inclusiva
- Evite jargões desnecessários
- Seja específico e mensurável quando possível
- Foque em entregas e resultados, não apenas tarefas

## Formato de Saída
Retorne o conteúdo em Markdown bem formatado, pronto para exibição.`;

async function validateAuth(
  req: Request,
  supabaseAdmin: SupabaseClient
): Promise<{ userId: string; organizationId: string | null; error: Response | null }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      userId: "",
      organizationId: null,
      error: new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Missing authorization header",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      ),
    };
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
      organizationId: null,
      error: new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid or expired token",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      ),
    };
  }

  const userId = user.id;
  const orgAuth = await checkOrgRole(supabaseAdmin, userId, ["admin", "people"]);
  
  if (!orgAuth.authorized) {
    return {
      userId: "",
      organizationId: null,
      error: new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Forbidden",
          status: 403,
          detail: "Requires admin or people role",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      ),
    };
  }

  return { userId, organizationId: orgAuth.organizationId, error: null };
}

// DISC profile descriptions for the prompt
const discProfiles: Record<string, { name: string; traits: string }> = {
  EXE: { name: "Executor", traits: "Liderança, Determinação, Foco em Resultados, Tomada de decisão rápida" },
  COM: { name: "Comunicador", traits: "Persuasão, Entusiasmo, Networking, Relacionamento interpessoal" },
  PLA: { name: "Planejador", traits: "Paciência, Consistência, Cooperação, Confiabilidade, Estabilidade" },
  ANA: { name: "Analista", traits: "Precisão, Análise Crítica, Organização, Atenção aos detalhes" },
  EXE_COM: { name: "Executor-Comunicador", traits: "Liderança Inspiradora, Persuasão, Iniciativa, Visão estratégica" },
  COM_PLA: { name: "Comunicador-Planejador", traits: "Diplomacia, Empatia, Mediação, Suporte à equipe" },
  PLA_ANA: { name: "Planejador-Analista", traits: "Metodologia, Precisão, Consistência, Expertise técnica" },
  ANA_EXE: { name: "Analista-Executor", traits: "Análise Estratégica, Decisão Informada, Eficiência, Pragmatismo" },
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log(`[${FUNCTION_NAME}][${requestId}] Start`);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { userId, organizationId, error: authError } = await validateAuth(req, supabaseAdmin);
  if (authError) return authError;

  const rlKey = getRateLimitKey(req, userId);
  const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
  if (!rl.allowed) return rl.response!;

  try {
    const body = await req.json();
    const { title, expected_profile_code, activities, parent_position_title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Validation Error",
          status: 400,
          detail: "O campo 'title' é obrigatório",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    // Check for LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(`[${FUNCTION_NAME}][${requestId}] LOVABLE_API_KEY not configured`);
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Integration Not Configured",
          status: 424,
          detail: "Integração com IA não configurada. LOVABLE_API_KEY ausente.",
        }),
        { status: 424, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    // Build user prompt
    const profileInfo = expected_profile_code && discProfiles[expected_profile_code]
      ? `\n\nPerfil Comportamental Esperado: ${discProfiles[expected_profile_code].name}\nCaracterísticas principais: ${discProfiles[expected_profile_code].traits}`
      : "";

    const hierarchyInfo = parent_position_title
      ? `\nCargo Superior: ${parent_position_title}`
      : "";

    const activitiesInfo = activities && activities.trim()
      ? `\n\nAtividades já definidas para referência:\n${activities}`
      : "";

    const userPrompt = `Gere a descrição completa para o cargo: **${title}**${hierarchyInfo}${profileInfo}${activitiesInfo}

Por favor, siga a estrutura definida e retorne o conteúdo em Markdown.`;

    console.log(`[${FUNCTION_NAME}][${requestId}] Calling Lovable AI`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${FUNCTION_NAME}][${requestId}] AI gateway error: ${response.status} ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            type: "about:blank",
            title: "Rate Limited",
            status: 429,
            detail: "Limite de requisições excedido. Tente novamente em alguns segundos.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            type: "about:blank",
            title: "Payment Required",
            status: 402,
            detail: "Créditos de IA esgotados. Entre em contato com o administrador.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "AI Service Error",
          status: 502,
          detail: "Erro ao comunicar com o serviço de IA. Tente novamente.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    const aiResponse = await response.json();
    const description = aiResponse.choices?.[0]?.message?.content || "";

    console.log(`[${FUNCTION_NAME}][${requestId}] Completed (length: ${description.length})`);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, errorMessage);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Erro interno ao processar a requisição",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
    );
  }
});
