import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt, needsReencryption, reencrypt } from './crypto.ts';

export interface GetSecretOptions {
  /** Update last_used_at timestamp (default: false) */
  updateLastUsed?: boolean;
  /** Log decryption event for audit (default: true) */
  logDecryption?: boolean;
  /** Calling function name for audit trail */
  callerFunction?: string;
  /** User ID performing the action (for audit) */
  userId?: string;
}

/**
 * Get integration secret for internal Edge Function use.
 * This function retrieves and decrypts the API key using AES-256-GCM.
 * 
 * Security features:
 * - Logs all decryption events for audit trail
 * - Auto-upgrades legacy encrypted values to PBKDF2 format
 * - Debounced last_used_at updates
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param organizationId - Organization ID to get secret for
 * @param provider - Provider name (e.g., 'fireflies', 'anthropic')
 * @param options - Optional settings
 * @returns The decrypted secret or null if not found/inactive
 */
export async function getIntegrationSecret(
  supabaseAdmin: SupabaseClient,
  organizationId: string,
  provider: string,
  options: GetSecretOptions = {}
): Promise<string | null> {
  const { 
    updateLastUsed = false, 
    logDecryption = true,
    callerFunction = 'unknown',
    userId = null
  } = options;

  console.log(`[get-integration-secret] Fetching ${provider} for org ${organizationId} (caller: ${callerFunction})`);
  
  // Fetch integration from database
  const { data, error } = await supabaseAdmin
    .from('organization_integrations')
    .select('id, encrypted_api_key, is_active, status, last_used_at, sensitivity')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .eq('environment', 'production')
    .maybeSingle();

  if (error) {
    console.error(`[get-integration-secret] Query error:`, error.message);
    return null;
  }

  if (!data) {
    console.log(`[get-integration-secret] No integration found for ${provider}`);
    return null;
  }

  if (!data.is_active || data.status === 'error') {
    console.log(`[get-integration-secret] Integration ${provider} is inactive or in error state`);
    return null;
  }

  if (!data.encrypted_api_key) {
    console.log(`[get-integration-secret] No encrypted key found for ${provider} (legacy data)`);
    return null;
  }

  // Decrypt the API key
  let secret: string;
  try {
    secret = await decrypt(data.encrypted_api_key);
    
    // Check if we need to upgrade the encryption
    if (needsReencryption(data.encrypted_api_key)) {
      console.log(`[get-integration-secret] Upgrading ${provider} to PBKDF2 encryption`);
      const newEncrypted = await reencrypt(data.encrypted_api_key);
      if (newEncrypted) {
        await supabaseAdmin
          .from('organization_integrations')
          .update({ encrypted_api_key: newEncrypted })
          .eq('id', data.id);
        console.log(`[get-integration-secret] Successfully upgraded encryption for ${provider}`);
      }
    }
  } catch (e) {
    console.error(`[get-integration-secret] Decryption failed:`, e);
    
    // Mark as error
    await supabaseAdmin
      .from('organization_integrations')
      .update({ 
        status: 'error', 
        last_error: 'Falha na descriptografia' 
      })
      .eq('id', data.id);
    
    // Log failed decryption attempt
    if (logDecryption) {
      await supabaseAdmin.from('integration_access_logs').insert({
        organization_id: organizationId,
        provider,
        action: 'key_decryption_failed',
        performed_by: userId,
        success: false,
        error_message: 'Decryption failed',
      });
    }
    
    return null;
  }

  // Log successful decryption for audit trail
  if (logDecryption) {
    await supabaseAdmin.from('integration_access_logs').insert({
      organization_id: organizationId,
      provider,
      action: 'key_decrypted',
      performed_by: userId,
      success: true,
      error_message: null,
    });
    console.log(`[get-integration-secret] Logged decryption event for ${provider} (caller: ${callerFunction})`);
  }

  // Update last_used_at with debounce (10 min)
  if (updateLastUsed) {
    const lastUsed = data.last_used_at ? new Date(data.last_used_at) : null;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    if (!lastUsed || lastUsed < tenMinutesAgo) {
      await supabaseAdmin
        .from('organization_integrations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);
    }
  }

  console.log(`[get-integration-secret] Successfully retrieved ${provider} secret (sensitivity: ${data.sensitivity || 'standard'})`);
  return secret;
}
