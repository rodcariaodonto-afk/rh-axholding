/**
 * AES-256-GCM Encryption Module with Enhanced Key Derivation
 * 
 * Uses Web Crypto API with PBKDF2 key derivation from SUPABASE_SERVICE_ROLE_KEY.
 * Format: "salt_hex:iv_hex:ciphertext_hex"
 * 
 * Security improvements:
 * - PBKDF2 with 100,000 iterations for key derivation (vs. simple SHA-256)
 * - Unique salt per encryption operation
 * - 96-bit IV for GCM mode
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits for salt
const PBKDF2_ITERATIONS = 100_000;

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Derive AES-256 key from SERVICE_ROLE_KEY using PBKDF2
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(serviceRoleKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Convert Uint8Array to ArrayBuffer for compatibility
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Legacy key derivation for backwards compatibility
 * Only used to decrypt old format (iv:ciphertext)
 */
async function deriveLegacyKey(): Promise<CryptoKey> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(serviceRoleKey);
  
  // SHA-256 produces 256 bits (32 bytes) - perfect for AES-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial);
  
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Check if encrypted string uses new format (salt:iv:ciphertext)
 */
function isNewFormat(encrypted: string): boolean {
  return encrypted.split(':').length === 3;
}

/**
 * Encrypt plaintext using AES-256-GCM with PBKDF2 key derivation
 * @returns "salt_hex:iv_hex:ciphertext_hex"
 */
export async function encrypt(plaintext: string): Promise<string> {
  // Generate random salt and IV
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  
  // Derive key using PBKDF2
  const key = await deriveKey(salt);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Convert IV to ArrayBuffer for compatibility
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    data
  );
  
  return `${bufferToHex(salt)}:${bufferToHex(iv)}:${bufferToHex(ciphertext)}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Supports both new format (salt:iv:ciphertext) and legacy format (iv:ciphertext)
 */
export async function decrypt(encrypted: string): Promise<string> {
  const parts = encrypted.split(':');
  
  let key: CryptoKey;
  let ivHex: string;
  let ciphertextHex: string;
  
  if (parts.length === 3) {
    // New format: salt:iv:ciphertext
    const [saltHex, ivPart, ciphertextPart] = parts;
    const salt = hexToBuffer(saltHex);
    key = await deriveKey(salt);
    ivHex = ivPart;
    ciphertextHex = ciphertextPart;
  } else if (parts.length === 2) {
    // Legacy format: iv:ciphertext (for backwards compatibility)
    console.warn('[crypto] Decrypting legacy format - consider re-encrypting with new format');
    key = await deriveLegacyKey();
    [ivHex, ciphertextHex] = parts;
  } else {
    throw new Error('Invalid encrypted format');
  }
  
  if (!ivHex || !ciphertextHex) {
    throw new Error('Invalid encrypted format');
  }
  
  const ivArray = hexToBuffer(ivHex);
  const ciphertextArray = hexToBuffer(ciphertextHex);
  
  // Convert to ArrayBuffer for compatibility
  const ivBuffer = ivArray.buffer.slice(ivArray.byteOffset, ivArray.byteOffset + ivArray.byteLength) as ArrayBuffer;
  const ciphertextBuffer = ciphertextArray.buffer.slice(ciphertextArray.byteOffset, ciphertextArray.byteOffset + ciphertextArray.byteLength) as ArrayBuffer;
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    ciphertextBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Re-encrypt a value with the new PBKDF2-based format
 * Use this to migrate legacy encrypted values
 */
export async function reencrypt(encrypted: string): Promise<string | null> {
  if (isNewFormat(encrypted)) {
    // Already in new format
    return null;
  }
  
  try {
    const plaintext = await decrypt(encrypted);
    return await encrypt(plaintext);
  } catch {
    return null;
  }
}

/**
 * Mask API key for display (show only last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 4) {
    return '••••';
  }
  return key.slice(-4);
}

/**
 * Check if encrypted value uses legacy format that should be upgraded
 */
export function needsReencryption(encrypted: string): boolean {
  return !isNewFormat(encrypted);
}
