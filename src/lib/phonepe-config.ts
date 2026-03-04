export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  CLIENT_ID: 'M228A8WCV77ZS_2603040645',
  CLIENT_SECRET: 'Y2MyMzQ0MTktNWU4Mi00Yzg4LTkzN2UtNDY2NTg1M2MwYmEw',
  CLIENT_VERSION: '1',
  
  // Sandbox/Test URLs
  API_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  AUTH_URL: 'https://api-preprod.phonepe.com/apis/apphub/v1',
  
  // Credentials for Checksum (X-VERIFY) - keeping for compatibility
  SALT_KEY: process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399',
  SALT_INDEX: process.env.NEXT_PUBLIC_PHONEPE_SALT_INDEX || '1',
  
  REDIRECT_URL: (process.env.NEXT_PUBLIC_APP_URL || '') + '/api/phonepe/callback',
  CALLBACK_URL: (process.env.NEXT_PUBLIC_APP_URL || '') + '/api/phonepe/callback',
};
