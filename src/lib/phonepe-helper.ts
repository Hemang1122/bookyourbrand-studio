import crypto from 'crypto';
import { phonePeConfig } from './phonepe-config';

/**
 * Generates the X-VERIFY checksum for PhonePe v1 API.
 * Format: SHA256(base64Payload + endpoint + saltKey) + "###" + saltIndex
 */
export function generateChecksum(payload: string, endpoint: string): string {
  const saltKey = phonePeConfig.SALT_KEY;
  const saltIndex = phonePeConfig.SALT_INDEX;
  
  // Create the string to hash: base64Payload + endpoint + saltKey
  const stringToHash = payload + endpoint + saltKey;
  
  // Generate SHA256 hash
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  
  // Return checksum in format: hash###saltIndex
  return `${sha256Hash}###${saltIndex}`;
}

/**
 * Specialized checksum generator for PhonePe Status API.
 * Supports manual salt parameters or uses defaults from config.
 */
export function generatePhonePeChecksum(
  payload: string, 
  endpoint: string, 
  saltKey?: string, 
  saltIndex?: string
): string {
  const sKey = saltKey || phonePeConfig.SALT_KEY;
  const sIndex = saltIndex || phonePeConfig.SALT_INDEX;
  
  const stringToHash = payload + endpoint + sKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  
  return `${sha256Hash}###${sIndex}`;
}

export function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decodePayload(encodedPayload: string): any {
  return JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
}
