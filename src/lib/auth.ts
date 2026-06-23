import { NextRequest } from 'next/server';

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-me-12345';

/**
 * Signs a payload using HMAC-SHA256 and returns a simple signed token string.
 */
export async function signToken(payload: { username: string; expires: number }): Promise<string> {
  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const data = encoder.encode(payloadJson);
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigArray = Array.from(new Uint8Array(signature));
  const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Base64 encode the JSON payload
  // We use btoa (safe for ascii string JSON since username is simple)
  // To support potential non-ASCII safely, we do basic base64 conversion.
  const payloadBase64 = btoa(unescape(encodeURIComponent(payloadJson)));
  
  return `${payloadBase64}.${sigHex}`;
}

/**
 * Verifies a signed token string. Returns the payload if valid, or null.
 */
export async function verifyToken(token: string): Promise<{ username: string; expires: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadBase64, sigHex] = parts;
    const payloadJson = decodeURIComponent(escape(atob(payloadBase64)));
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.expires < Date.now()) return null;

    const encoder = new TextEncoder();
    const data = encoder.encode(payloadJson);
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Parse sigHex back to Uint8Array
    const matches = sigHex.match(/.{1,2}/g);
    if (!matches) return null;
    const sigBytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    return isValid ? payload : null;
  } catch (err) {
    return null;
  }
}

/**
 * Validates admin credentials against environment variables.
 */
export function checkAdminCredentials(username?: string, password?: string): boolean {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'loobycardadmin2026';
  return username === adminUser && password === adminPass;
}
