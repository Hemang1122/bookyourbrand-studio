export const phonePeConfig = {
  MERCHANT_ID: 'M228A8WCV77ZS',
  CLIENT_ID: process.env.PHONEPE_CLIENT_ID || 'M228A8WCV77ZS_2603040645',
  CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET || 'Y2MyMzQ0MTktNWU4Mi00Yzg4LTkzN2UtNDY2NTg1M2MwYmEw',
  CLIENT_VERSION: 1,
  
  // Sandbox/Test URLs for v2 Standard Checkout
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  
  get AUTH_URL() {
    return `${this.BASE_URL}/v1/oauth/token`;
  },
  
  get PAY_URL() {
    return `${this.BASE_URL}/checkout/v2/pay`;
  },

  get STATUS_URL() {
    // v2 Status check URL pattern: /checkout/v2/order/{merchantOrderId}/status
    return `${this.BASE_URL}/checkout/v2/order`;
  },
  
  get REDIRECT_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    return `${baseUrl}/payment-success`;
  },
  
  get CALLBACK_URL() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    return `${baseUrl}/api/phonepe/callback`;
  }
};
