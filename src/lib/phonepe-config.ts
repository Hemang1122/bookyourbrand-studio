export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  CLIENT_ID: 'M228A8WCV77ZS_2603040645',
  CLIENT_SECRET: 'Y2MyMzQ0MTktNWU4Mi00Yzg4LTkzN2UtNDY2NTg1M2MwYmEw', // This is your Salt Key
  SALT_KEY: 'Y2MyMzQ0MTktNWU4Mi00Yzg4LTkzN2UtNDY2NTg1M2MwYmEw', // Same as client secret
  SALT_INDEX: '1',
  
  // Test environment URLs
  API_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  
  get REDIRECT_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    // Redirect user to success page after payment
    return `${baseUrl}/payment-success`;
  },
  get CALLBACK_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    // Server-to-server webhook
    return `${baseUrl}/api/phonepe/callback`;
  }
};
