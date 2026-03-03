import crypto from 'crypto';
import { phonePeConfig } from './phonepe-config';

export function generatePhonePeChecksum(payload: string, endpoint: string): string {
  const saltKey = phonePeConfig.SALT_KEY;
  const saltIndex = phonePeConfig.SALT_INDEX;
  
  const stringToHash = payload + endpoint + saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  
  return sha256Hash + '###' + saltIndex;
}

export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decodePayload(encodedPayload: string): any {
  return JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
}