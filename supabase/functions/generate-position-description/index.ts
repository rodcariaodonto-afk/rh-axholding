import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getIntegrationSecret } from "../_shared/get-integration-secret.ts";
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

/**
 * Validates user authentication and returns user ID and organization
 */
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

  // Check if user has admin or people role (org-scoped)
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

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log(`[${FUNCTION_NAME}][${requestId}] Start`);

  // Initialize admin client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate authentication
  const { userId, organizationId, error: authError } = await validateAuth(req, supabaseAdmin);
  if (authError) {
    return authError;
  }

  // === SECURITY: Rate limiting (SEC-007) ===
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

    // Get Anthropic API key from vault
    let ANTHROPIC_API_KEY: string | null = null;
    let apiKeySource = "none";

    if (organizationId) {
      ANTHROPIC_API_KEY = await getIntegrationSecret(supabaseAdmin, organizationId, "anthropic", {
        updateLastUsed: true,
      });
      if (ANTHROPIC_API_KEY) {
        apiKeySource = "vault";
      }
    }

    // Fallback to global env
    if (!ANTHROPIC_API_KEY) {
      ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || null;
      if (ANTHROPIC_API_KEY) {
        apiKeySource = "global";
      }
    }

    // No key available
    if (!ANTHROPIC_API_KEY) {
      console.error(`[${FUNCTION_NAME}][${requestId}] No Anthropic API key available`);
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Integration Not Configured",
          status: 424,
          detail: "Integração com IA não configurada. Configure a integração com Anthropic nas configurações.",
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

    console.log(`[${FUNCTION_NAME}][${requestId}] Calling AI`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${FUNCTION_NAME}][${requestId}] Anthropic API error: ${response.status} ${errorText}`);
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
    const contentBlock = aiResponse.content?.[0];
    const description = contentBlock?.type === "text" ? contentBlock.text : "";

    console.log(`[${FUNCTION_NAME}][${requestId}] Completed (length: ${description.length}, source: ${apiKeySource})`);

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
