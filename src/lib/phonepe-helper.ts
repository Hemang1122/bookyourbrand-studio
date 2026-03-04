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
    const clientId = process.env.PHONEPE_CLIENT_ID || phonePeConfig.CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET || phonePeConfig.CLIENT_SECRET;

    console.log('--- PhonePe Token Request ---');
    console.log('URL:', phonePeConfig.AUTH_URL);

    // OAuth standard requires x-www-form-urlencoded for the token endpoint
    const body = new URLSearchParams({
      client_id: clientId,
      client_version: String(phonePeConfig.CLIENT_VERSION),
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const response = await fetch(phonePeConfig.AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("PHONEPE RAW OAUTH ERROR:", responseText);
      throw new Error(`PhonePe authentication failed (${response.status}): ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      if (data.access_token) {
        cachedAccessToken = data.access_token;
        // Tokens are usually valid for 1 hour (3600s)
        const expiresIn = data.expires_in || 3600;
        tokenExpiry = Date.now() + (expiresIn * 1000);
        console.log('PhonePe OAuth Token acquired successfully');
        return cachedAccessToken;
      } else {
        throw new Error('No access_token in response JSON');
      }
    } catch (parseError) {
      console.error("FAILED TO PARSE PHONEPE RESPONSE AS JSON:", responseText);
      throw new Error('PhonePe returned non-JSON response during authentication');
    }
  } catch (error: any) {
    console.error('PhonePe OAuth Helper Failure:', error.message);
    throw error;
  }
}

/**
 * Encodes an object to a Base64 string.
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
