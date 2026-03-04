export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  CLIENT_ID: 'M228A8WCV77ZS_2603040645',
  CLIENT_SECRET: 'Y2MyMzQ0MTktNWU4Mi00Yzg4LTkzN2UtNDY2NTg1M2MwYmEw',
  CLIENT_VERSION: '1',
  
  // Sandbox/Test URLs
  API_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  AUTH_URL: 'https://api-preprod.phonepe.com/apis/apphub/v1',
  
  // Dynamic URLs from environment
  get REDIRECT_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/api/phonepe/callback`;
  },
  get CALLBACK_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/api/phonepe/callback`;
  }
};
