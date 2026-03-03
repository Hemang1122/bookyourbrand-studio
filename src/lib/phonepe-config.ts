export const phonePeConfig = {
  MERCHANT_ID: process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID || 'M228A8WCV77ZS',
  SALT_KEY: process.env.PHONEPE_SALT_KEY || '',
  SALT_INDEX: process.env.NEXT_PUBLIC_PHONEPE_SALT_INDEX || '1',
  
  // UAT for testing, Production for live
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://mercury-t2.phonepe.com/v3'
    : 'https://mercury-uat.phonepe.com/enterprise-sandbox/v3',
    
  CALLBACK_URL: process.env.NEXT_PUBLIC_PHONEPE_CALLBACK_URL || '',
};
