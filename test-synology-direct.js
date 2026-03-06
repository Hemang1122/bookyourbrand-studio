const axios = require('axios');

const NAS_URL = 'https://bybvasai.quickconnect.to';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function testMultipleMethods() {
  console.log('🔐 Testing Synology NAS Connection...\n');
  
  // Method 1: Try API version 3
  console.log('📡 Method 1: Trying API version 3...');
  try {
    const response = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 3,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      timeout: 10000
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      console.log('✅ Method 1 SUCCESS!');
      console.log('SID:', response.data.data.sid);
      return true;
    }
  } catch (error) {
    console.log('❌ Method 1 failed:', error.message);
  }
  
  // Method 2: Try API version 2
  console.log('\n📡 Method 2: Trying API version 2...');
  try {
    const response = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 2,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      timeout: 10000
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      console.log('✅ Method 2 SUCCESS!');
      console.log('SID:', response.data.data.sid);
      return true;
    }
  } catch (error) {
    console.log('❌ Method 2 failed:', error.message);
  }
  
  // Method 3: Check if we're getting redirected
  console.log('\n📡 Method 3: Checking for redirects...');
  try {
    const response = await axios.get(NAS_URL, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.location || 'No redirect');
    
    if (response.headers.location) {
      console.log('🔄 QuickConnect is redirecting to:', response.headers.location);
      console.log('💡 We might need to use this URL instead!');
    }
  } catch (error) {
    console.log('Error checking redirects:', error.message);
  }
  
  console.log('\n❌ All methods failed. Please check:');
  console.log('1. Is the NAS online and accessible?');
  console.log('2. Are the credentials correct?');
  console.log('3. Is QuickConnect enabled on the NAS?');
  
  return false;
}

testMultipleMethods();
