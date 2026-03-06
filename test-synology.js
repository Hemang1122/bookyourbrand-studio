const axios = require('axios');

const NAS_URL = 'https://bybvasai.quickconnect.to';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function testSynologyAPI() {
  try {
    console.log('🔐 Testing Synology NAS API connection...');
    
    // Step 1: Get API Info
    const infoResponse = await axios.get(`${NAS_URL}/webapi/query.cgi`, {
      params: {
        api: 'SYNO.API.Info',
        version: 1,
        method: 'query'
      }
    });
    
    console.log('✅ API Info retrieved:', Object.keys(infoResponse.data.data).length, 'APIs available');
    
    // Step 2: Login
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
    
    if (loginResponse.data.success) {
      const sid = loginResponse.data.data.sid;
      console.log('✅ Login successful! SID:', sid.substring(0, 10) + '...');
      
      // Step 3: List Files
      const listResponse = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
        params: {
          api: 'SYNO.FileStation.List',
          version: 2,
          method: 'list',
          folder_path: '/',
          _sid: sid
        }
      });
      
      if (listResponse.data.success) {
        console.log('✅ Files listed:', listResponse.data.data.files.length, 'items found');
        console.log('📂 Folders:', listResponse.data.data.files.map(f => f.name));
      } else {
        console.error('❌ List failed:', listResponse.data);
      }
      
      // Step 4: Logout
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
      console.error('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSynologyAPI();
