// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { encrypt, maskApiKey, needsReencryption, reencrypt } from '../_shared/crypto.ts';
import { validators, testers, expectedFormats } from '../_shared/validators.ts';
import { checkRateLimit, getRateLimitKey } from '../_shared/rate-limit.ts';

const FUNCTION_NAME = 'manage-secrets';

// ============================================
// Zod Schemas for Input Validation
// ============================================

const IntegrationProviderSchema = z.enum(['anthropic', 'fireflies', 'openai', 'github', 'resend']);
const IntegrationSensitivitySchema = z.enum(['standard', 'high', 'critical']);

const CreateIntegrationSchema = z.object({
  organization_id: z.string().uuid(),
  provider: IntegrationProviderSchema,
  api_key: z.string().min(10).max(500),
  display_name: z.string().max(100).optional(),
  test_connection: z.boolean().default(false),
  sensitivity: IntegrationSensitivitySchema.default('standard'),
});

const TestIntegrationSchema = z.object({
  organization_id: z.string().uuid(),
  id: z.string().uuid(),
  action: z.literal('test'),
});

const DeleteIntegrationSchema = z.object({
  organization_id: z.string().uuid(),
  id: z.string().uuid(),
});

const ListIntegrationsSchema = z.object({
  organization_id: z.string().uuid(),
});

// ============================================
// Helper Functions
// ============================================

function zodErrorResponse(error: z.ZodError, requestId: string): Response {
  console.log(`[${FUNCTION_NAME}][${requestId}] Validation error`);
  return new Response(
    JSON.stringify({
      type: "about:blank",
      title: "Validation Error",
      status: 400,
      detail: "Invalid request data",
      requestId,
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
  );
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${FUNCTION_NAME}][${requestId}] ${req.method}`);

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Missing authorization header",
          requestId,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
      );
    }

    // User client (to get user info and check permissions)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client (to bypass RLS for writes)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid or expired token",
          requestId,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
      );
    }

    const userId = userData.user.id;

    // === SECURITY: Rate limiting (SEC-007) ===
    const rlKey = getRateLimitKey(req, userId);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;

    // Route by method
    switch (req.method) {
      case 'GET':
        return await handleGet(req, supabaseAdmin, requestId);
      case 'POST':
        return await handlePost(req, supabaseAdmin, userId, requestId);
      case 'DELETE':
        return await handleDelete(req, supabaseAdmin, userId, requestId);
      default:
        return new Response(
          JSON.stringify({
            type: "about:blank",
            title: "Method Not Allowed",
            status: 405,
            detail: "Supported methods: GET, POST, DELETE",
            requestId,
          }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, errorMessage);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }
});

/**
 * GET - List integrations for an organization
 */
async function handleGet(
  req: Request,
  supabase: any,
  requestId: string
): Promise<Response> {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  
  // Validate input
  const validation = ListIntegrationsSchema.safeParse(params);
  if (!validation.success) {
    return zodErrorResponse(validation.error, requestId);
  }
  
  const { organization_id } = validation.data;
  console.log(`[${FUNCTION_NAME}][${requestId}] GET integrations`);

  const { data, error } = await supabase
    .from('organization_integrations')
    .select('id, organization_id, provider, environment, display_name, last_four, status, is_active, last_used_at, last_tested_at, last_test_success, last_error, sensitivity, last_rotated_at, created_at, updated_at')
    .eq('organization_id', organization_id)
    .order('provider');

  if (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Query error:`, error.message);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Database Error",
        status: 500,
        detail: "Failed to fetch integrations",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  return new Response(
    JSON.stringify(data || []),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * POST - Create/update integration or test connection
 */
async function handlePost(
  req: Request,
  supabaseAdmin: any,
  userId: string,
  requestId: string
): Promise<Response> {
  const body = await req.json();

  // Check if this is a test action
  if (body.action === 'test' && body.id) {
    const validation = TestIntegrationSchema.safeParse(body);
    if (!validation.success) {
      return zodErrorResponse(validation.error, requestId);
    }
    return await handleTest(supabaseAdmin, validation.data.organization_id, validation.data.id, userId, requestId);
  }

  // Validate create/update input
  const validation = CreateIntegrationSchema.safeParse(body);
  if (!validation.success) {
    return zodErrorResponse(validation.error, requestId);
  }

  const { organization_id, provider, api_key, display_name, test_connection, sensitivity } = validation.data;
  console.log(`[${FUNCTION_NAME}][${requestId}] POST provider: ${provider}, sensitivity: ${sensitivity}`);

  // Check permission (different for critical integrations)
  const permissionCheck = sensitivity === 'critical' 
    ? 'can_manage_critical_integrations'
    : 'can_manage_org_integrations';
    
  const { data: canManage } = await supabaseAdmin.rpc(permissionCheck, {
    p_user_id: userId,
    p_org_id: organization_id,
  });

  if (!canManage) {
    const errorMessage = sensitivity === 'critical'
      ? 'Apenas administradores globais ou donos da organização podem gerenciar integrações críticas'
      : 'Apenas administradores podem gerenciar integrações';
      
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: errorMessage,
        requestId,
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Validate key format
  const validator = validators[provider];
  if (validator && !validator(api_key)) {
    const expectedFormat = expectedFormats[provider] || 'formato válido';
    console.log(`[${FUNCTION_NAME}][${requestId}] Invalid key format`);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Validation Error",
        status: 400,
        detail: `Formato de chave inválido para ${provider}. ${expectedFormat}`,
        requestId,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Optional: Test connection before saving
  let testSuccess: boolean | null = null;
  if (test_connection) {
    const tester = testers[provider];
    if (tester) {
      testSuccess = await tester(api_key);
      if (!testSuccess) {
        return new Response(
          JSON.stringify({
            type: "about:blank",
            title: "Validation Error",
            status: 400,
            detail: "Chave inválida ou sem permissões necessárias",
            requestId,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
        );
      }
      console.log(`[${FUNCTION_NAME}][${requestId}] Connection test passed for ${provider}`);
    }
  }

  // Encrypt the API key with PBKDF2
  const encryptedKey = await encrypt(api_key);
  const lastFour = maskApiKey(api_key);

  // Check if integration exists (for rotation tracking)
  const { data: existing } = await supabaseAdmin
    .from('organization_integrations')
    .select('id, encrypted_api_key')
    .eq('organization_id', organization_id)
    .eq('provider', provider)
    .eq('environment', 'production')
    .maybeSingle();

  const isRotation = !!existing;
  const now = new Date().toISOString();

  // Upsert integration
  const upsertData: Record<string, any> = {
    organization_id,
    provider,
    environment: 'production',
    encrypted_api_key: encryptedKey,
    display_name: display_name || null,
    last_four: lastFour,
    sensitivity,
    status: 'active',
    is_active: true,
    last_error: null,
    last_tested_at: testSuccess !== null ? now : null,
    last_test_success: testSuccess,
    updated_at: now,
  };

  if (!isRotation) {
    upsertData.created_by = userId;
  } else {
    // Track key rotation
    upsertData.last_rotated_at = now;
  }

  const { data, error } = await supabaseAdmin
    .from('organization_integrations')
    .upsert(upsertData, {
      onConflict: 'organization_id,provider,environment',
    })
    .select('id, provider, last_four, status, sensitivity')
    .single();

  if (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Upsert error:`, error.message);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Database Error",
        status: 500,
        detail: "Failed to save integration",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Log action
  await supabaseAdmin.from('integration_access_logs').insert({
    organization_id,
    provider,
    action: isRotation ? 'rotated' : 'created',
    performed_by: userId,
    success: true,
  });

  console.log(`[${FUNCTION_NAME}][${requestId}] Success: ${isRotation ? 'rotated' : 'created'} (sensitivity: ${sensitivity})`);

  return new Response(
    JSON.stringify({
      id: data?.id,
      provider: data?.provider,
      last_four: data?.last_four,
      status: data?.status,
      sensitivity: data?.sensitivity,
      action: isRotation ? 'rotated' : 'created',
      message: isRotation ? 'Chave atualizada com sucesso' : 'Integração configurada com sucesso',
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * DELETE - Remove integration
 */
async function handleDelete(
  req: Request,
  supabaseAdmin: any,
  userId: string,
  requestId: string
): Promise<Response> {
  // Some clients/platforms drop the request body on DELETE.
  // Accept both JSON body and query params to avoid runtime errors.
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const url = new URL(req.url);
  const params = {
    organization_id: body?.organization_id ?? url.searchParams.get('organization_id'),
    id: body?.id ?? url.searchParams.get('id'),
  };

  // Validate input
  const validation = DeleteIntegrationSchema.safeParse(params);
  if (!validation.success) {
    return zodErrorResponse(validation.error, requestId);
  }

  const { organization_id, id } = validation.data;
  console.log(`[${FUNCTION_NAME}][${requestId}] DELETE integration`);

  // Get integration info for permission check and logging
  const { data: integration } = await supabaseAdmin
    .from('organization_integrations')
    .select('provider, sensitivity')
    .eq('id', id)
    .eq('organization_id', organization_id)
    .single();

  if (!integration) {
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Integration not found",
        requestId,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Check permission (different for critical integrations)
  const permissionCheck = integration.sensitivity === 'critical' 
    ? 'can_manage_critical_integrations'
    : 'can_manage_org_integrations';
    
  const { data: canManage } = await supabaseAdmin.rpc(permissionCheck, {
    p_user_id: userId,
    p_org_id: organization_id,
  });

  if (!canManage) {
    const errorMessage = integration.sensitivity === 'critical'
      ? 'Apenas administradores globais ou donos da organização podem remover integrações críticas'
      : 'Apenas administradores podem gerenciar integrações';
      
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: errorMessage,
        requestId,
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Delete integration
  const { error } = await supabaseAdmin
    .from('organization_integrations')
    .delete()
    .eq('id', id)
    .eq('organization_id', organization_id);

  if (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Delete error:`, error.message);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Database Error",
        status: 500,
        detail: "Failed to delete integration",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Log action
  await supabaseAdmin.from('integration_access_logs').insert({
    organization_id,
    provider: integration.provider,
    action: 'deleted',
    performed_by: userId,
    success: true,
  });

  console.log(`[${FUNCTION_NAME}][${requestId}] Deleted successfully`);

  return new Response(
    JSON.stringify({ success: true, message: 'Integração removida com sucesso' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Test existing integration connection
 */
async function handleTest(
  supabaseAdmin: any,
  organizationId: string,
  integrationId: string,
  userId: string,
  requestId: string
): Promise<Response> {
  console.log(`[${FUNCTION_NAME}][${requestId}] TEST integration`);

  // Import decrypt dynamically to avoid circular deps
  const { decrypt, needsReencryption: needsUpgrade, reencrypt: upgradeEncryption } = await import('../_shared/crypto.ts');

  // Get integration
  const { data: integration, error: fetchError } = await supabaseAdmin
    .from('organization_integrations')
    .select('id, organization_id, provider, encrypted_api_key, sensitivity')
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !integration) {
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Integration not found",
        requestId,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Check permission (different for critical integrations)
  const permissionCheck = integration.sensitivity === 'critical' 
    ? 'can_manage_critical_integrations'
    : 'can_manage_org_integrations';
    
  const { data: canManage } = await supabaseAdmin.rpc(permissionCheck, {
    p_user_id: userId,
    p_org_id: organizationId,
  });

  if (!canManage) {
    const errorMessage = integration.sensitivity === 'critical'
      ? 'Apenas administradores globais ou donos da organização podem testar integrações críticas'
      : 'Apenas administradores podem testar integrações';
      
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: errorMessage,
        requestId,
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  if (!integration.encrypted_api_key) {
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "No API key found (legacy integration)",
        requestId,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Decrypt and test
  let apiKey: string;
  try {
    apiKey = await decrypt(integration.encrypted_api_key);
    
    // Upgrade encryption if using legacy format
    if (needsUpgrade(integration.encrypted_api_key)) {
      console.log(`[${FUNCTION_NAME}][${requestId}] Upgrading encryption`);
      const newEncrypted = await upgradeEncryption(integration.encrypted_api_key);
      if (newEncrypted) {
        await supabaseAdmin
          .from('organization_integrations')
          .update({ encrypted_api_key: newEncrypted })
          .eq('id', integrationId);
      }
    }
  } catch (e) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Decryption failed:`, e);
    
    // Log failed decryption
    await supabaseAdmin.from('integration_access_logs').insert({
      organization_id: organizationId,
      provider: integration.provider,
      action: 'key_decryption_failed',
      performed_by: userId,
      success: false,
      error_message: 'Decryption failed during test',
    });
    
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to decrypt API key",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } }
    );
  }

  // Log successful decryption for audit
  await supabaseAdmin.from('integration_access_logs').insert({
    organization_id: organizationId,
    provider: integration.provider,
    action: 'key_decrypted',
    performed_by: userId,
    success: true,
  });

  const tester = testers[integration.provider];
  
  let testSuccess = true;
  let errorMessage: string | null = null;

  if (tester) {
    try {
      testSuccess = await tester(apiKey);
      if (!testSuccess) {
        errorMessage = 'Falha na conexão: chave inválida ou sem permissões';
      }
    } catch (e) {
      testSuccess = false;
      errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
    }
  }

  // Update integration status
  await supabaseAdmin
    .from('organization_integrations')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_success: testSuccess,
      last_error: errorMessage,
      status: testSuccess ? 'active' : 'error',
    })
    .eq('id', integrationId);

  // Log test action
  await supabaseAdmin.from('integration_access_logs').insert({
    organization_id: organizationId,
    provider: integration.provider,
    action: 'tested',
    performed_by: userId,
    success: testSuccess,
    error_message: errorMessage,
  });

  console.log(`[${FUNCTION_NAME}][${requestId}] Test result: ${testSuccess ? 'success' : 'failed'}`);

  return new Response(
    JSON.stringify({
      success: testSuccess,
      message: testSuccess ? 'Conexão testada com sucesso' : 'Falha no teste de conexão',
      error: errorMessage,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
