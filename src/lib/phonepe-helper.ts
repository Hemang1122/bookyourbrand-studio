import { phonePeConfig } from './phonepe-config';
import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generates an OAuth2 access token for PhonePe Standard Checkout v2.
 * Uses the client_credentials grant type.
 */
export async function getPhonePeAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 300000) {
    return cachedAccessToken;
  }

  try {
    const response = await axios.post(
      phonePeConfig.AUTH_URL,
      {
        client_id: phonePeConfig.CLIENT_ID,
        client_version: phonePeConfig.CLIENT_VERSION,
        client_secret: phonePeConfig.CLIENT_SECRET,
        grant_type: 'client_credentials'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.access_token) {
      cachedAccessToken = response.data.access_token;
      // Tokens are typically valid for 1 hour (3600s)
      const expiresIn = response.data.expires_in || 3600;
      tokenExpiry = Date.now() + (expiresIn * 1000);
      return cachedAccessToken;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error: any) {
    console.error('PhonePe OAuth Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with PhonePe');
  }
}

/**
 * Encodes an object to a Base64 string (used for some callback payloads if needed).
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
