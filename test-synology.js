const axios = require('axios');

const NAS_URL = 'https://bybvasai.quickconnect.to';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function testSynologyAPI() {
  try {
    console.log('🔐 Testing Synology NAS API connection...');
    console.log('🌐 NAS URL:', NAS_URL);
    console.log('👤 Username:', USERNAME);
    
    // Step 1: Get API Info
    console.log('\n📡 Step 1: Getting API info...');
    const infoResponse = await axios.get(`${NAS_URL}/webapi/query.cgi`, {
      params: {
        api: 'SYNO.API.Info',
        version: 1,
        method: 'query'
      }
    });
    
    console.log('Response:', JSON.stringify(infoResponse.data, null, 2));
    
    if (infoResponse.data && infoResponse.data.data) {
      console.log('✅ API Info retrieved:', Object.keys(infoResponse.data.data).length, 'APIs available');
    }
    
    // Step 2: Login
    console.log('\n🔑 Step 2: Attempting login...');
    const loginResponse = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 3,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      }
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data && loginResponse.data.success) {
      const sid = loginResponse.data.data.sid;
      console.log('✅ Login successful! SID:', sid.substring(0, 10) + '...');
      
      // Step 3: List Files
      console.log('\n📂 Step 3: Listing files...');
      const listResponse = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
        params: {
          api: 'SYNO.FileStation.List',
          version: 2,
          method: 'list',
          folder_path: '/',
          _sid: sid
        }
      });
      
      console.log('List response:', JSON.stringify(listResponse.data, null, 2));
      
      if (listResponse.data && listResponse.data.success) {
        const files = listResponse.data.data.files || [];
        console.log('✅ Files listed:', files.length, 'items found');
        console.log('📂 Folders:', files.map(f => f.name));
      }
      
      // Step 4: Logout
      console.log('\n🚪 Step 4: Logging out...');
      await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
        params: {
          api: 'SYNO.API.Auth',
          version: 3,
          method: 'logout',
          session: 'FileStation',
          _sid: sid
        }
      });
      
      console.log('✅ Logout successful');
      console.log('\n🎉 NAS API is working perfectly!');
      
    } else {
      console.error('❌ Login failed');
      console.error('Error code:', loginResponse.data?.error?.code);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSynologyAPI();
