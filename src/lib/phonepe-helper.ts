import crypto from 'crypto';
import { phonePeConfig } from './phonepe-config';
import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generates the X-VERIFY checksum for PhonePe requests.
 */
export function generatePhonePeChecksum(payload: string, endpoint: string): string {
  const saltKey = phonePeConfig.SALT_KEY;
  const saltIndex = phonePeConfig.SALT_INDEX;
  
  const stringToHash = payload + endpoint + saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  
  return sha256Hash + '###' + saltIndex;
}

/**
 * Encodes a JSON object to base64 for PhonePe payloads.
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decodes a base64 encoded payload from PhonePe.
 */
export function decodePayload(encodedPayload: string): any {
  return JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
}

/**
 * Fetches and caches a PhonePe access token using Client Credentials.
 */
export async function getPhonePeAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    console.log('Using cached access token');
    return cachedAccessToken;
  }

  try {
    console.log('Requesting new PhonePe access token...');
    
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
      // Set expiry to 50 minutes (tokens usually valid for 1 hour)
      tokenExpiry = Date.now() + (50 * 60 * 1000);
      
      console.log('Access token obtained successfully');
      return cachedAccessToken;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error: any) {
    console.error('Failed to get PhonePe access token:', error.response?.data || error.message);
    throw new Error('PhonePe authentication failed');
  }
}
