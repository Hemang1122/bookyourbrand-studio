import { phonePeConfig } from './phonepe-config';
import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Fetches and caches a PhonePe access token using Client Credentials flow (AppHub).
 */
export async function getPhonePeAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (cachedAccessToken && Date.now() < (tokenExpiry - 300000)) {
    return cachedAccessToken;
  }

  try {
    const response = await axios.post(
      `${phonePeConfig.AUTH_URL}/authorization/token`,
      {
        grantType: 'CLIENT_CREDENTIALS',
        clientId: phonePeConfig.CLIENT_ID,
        clientSecret: phonePeConfig.CLIENT_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.accessToken) {
      cachedAccessToken = response.data.accessToken;
      // Tokens are usually valid for 1 hour (3600 seconds)
      tokenExpiry = Date.now() + (response.data.expiresIn * 1000);
      return cachedAccessToken;
    } else {
      throw new Error('No access token in PhonePe response');
    }
  } catch (error: any) {
    console.error('PhonePe Auth Error:', error.response?.data || error.message);
    throw new Error('PhonePe authentication failed');
  }
}
