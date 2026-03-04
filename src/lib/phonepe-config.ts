export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  SALT_KEY: process.env.PHONEPE_SALT_KEY || '9f146785-f533-4b52-800b-2dc5ba548da4',
  SALT_INDEX: process.env.NEXT_PUBLIC_PHONEPE_SALT_INDEX || '1',
  
  // Standard Checkout API Endpoints
  API_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Use production URL when live
  
  get REDIRECT_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/api/phonepe/callback`;
  },
  get CALLBACK_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/api/phonepe/callback`;
  }
};
