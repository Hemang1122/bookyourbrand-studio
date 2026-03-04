import { phonePeConfig } from './phonepe-config';
import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generates an OAuth2 access token for PhonePe Standard Checkout v2.
 * Uses the client_credentials grant type with specific snake_case payload.
 */
export async function getPhonePeAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 300000) {
    return cachedAccessToken;
  }

  try {
    console.log('Requesting new PhonePe access token (v2)...');
    
    // Debug credentials visibility (logs to server console only)
    if (!phonePeConfig.CLIENT_ID || !phonePeConfig.CLIENT_SECRET) {
      console.warn('CRITICAL: PhonePe Credentials missing from environment');
    }

    const response = await fetch(phonePeConfig.AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: phonePeConfig.CLIENT_ID,
        client_version: phonePeConfig.CLIENT_VERSION, // Must be a number (1)
        client_secret: phonePeConfig.CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
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
 * Encodes an object to a Base64 string.
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
