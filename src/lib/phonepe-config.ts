export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  CLIENT_ID: 'M228A8WCV77ZS_2603040645',
  CLIENT_SECRET: '9f146785-f533-4b52-800b-2dc5ba548da4',
  CLIENT_VERSION: '1',
  
  // Sandbox/Test URLs for OAuth and Checkout
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  
  get AUTH_URL() {
    return `${this.BASE_URL}/v1/oauth/token`;
  },
  
  get PAY_URL() {
    return `${this.BASE_URL}/checkout/v2/pay`;
  },

  get STATUS_URL() {
    return `${this.BASE_URL}/checkout/v2/status`;
  },
  
  get REDIRECT_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    return `${baseUrl}/api/phonepe/callback`;
  },
  
  get CALLBACK_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    return `${baseUrl}/api/phonepe/callback`;
  }
};
