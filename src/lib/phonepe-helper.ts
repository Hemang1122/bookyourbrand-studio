import { phonePeConfig } from './phonepe-config';
import crypto from 'crypto';

/**
 * Generates the X-VERIFY checksum required by PhonePe Standard PG.
 * Formula: SHA256(Base64Payload + endpoint + SaltKey) + "###" + SaltIndex
 */
export function generatePhonePeChecksum(payload: string, endpoint: string): string {
  const data = payload + endpoint + phonePeConfig.SALT_KEY;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `${hash}###${phonePeConfig.SALT_INDEX}`;
}

/**
 * Encodes an object to a Base64 string.
 */
export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
