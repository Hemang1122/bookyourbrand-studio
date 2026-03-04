import { phonePeConfig } from './phonepe-config';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generates an OAuth2 access token for PhonePe Standard Checkout v2.
 * Uses the client_credentials grant type with application/x-www-form-urlencoded body.
 */
export async function getPhonePeAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 300000) {
    return cachedAccessToken;
  }

  try {
    console.log('Requesting new PhonePe access token (v2 OAuth)...');
    
    // OAuth standard requires x-www-form-urlencoded for the token endpoint
    const body = new URLSearchParams({
      client_id: phonePeConfig.CLIENT_ID,
      client_version: String(phonePeConfig.CLIENT_VERSION),
      client_secret: phonePeConfig.CLIENT_SECRET,
      grant_type: "client_credentials",
    });

    const response = await fetch(phonePeConfig.AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PhonePe Auth Error Details:", data);
      throw new Error(data.message || 'Failed to authenticate with PhonePe');
    }

    if (data.access_token) {
      cachedAccessToken = data.access_token;
      // Tokens are usually valid for 1 hour (3600s)
      const expiresIn = data.expires_in || 3600;
      tokenExpiry = Date.now() + (expiresIn * 1000);
      console.log('PhonePe OAuth Token acquired successfully');
      return cachedAccessToken;
    } else {
      throw new Error('No access_token in response');
    }
  } catch (error: any) {
    console.error('PhonePe OAuth Helper Failure:', error.message);
    throw new Error('PhonePe authentication failed: ' + error.message);
  }
}

/**
 * Encodes an object to a Base64 string (useful for legacy v1 headers if needed).
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
