const axios = require('axios');

const QUICKCONNECT_ID = 'bybvasai';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function testSynologyAPI() {
  try {
    console.log('🔍 Step 1: Resolving QuickConnect...');
    
    // Get the actual NAS address from QuickConnect
    const pingResponse = await axios.get('https://global.quickconnect.to/Serv.php', {
      params: {
        version: 1,
        command: 'get_server_info',
        stop_when_error: false,
        stop_when_success: false,
        id: 'dsm_portal_https',
        serverID: QUICKCONNECT_ID,
        is_gofile: false
      }
    });
    
    console.log('Response:', JSON.stringify(pingResponse.data, null, 2));
    
    if (!pingResponse.data.success) {
      throw new Error('QuickConnect resolution failed');
    }
    
    // Extract the best server URL
    const server = pingResponse.data.server;
    let nasUrl;
    
    if (server.interface && server.interface[0]) {
      nasUrl = `https://${server.interface[0].ip}:${server.interface[0].port}`;
    } else if (server.ddns) {
      nasUrl = `https://${server.ddns}:${server.port}`;
    } else {
      throw new Error('Could not determine NAS URL');
    }
    
    console.log('✅ NAS URL:', nasUrl);
    console.log('\n🔐 Step 2: Testing API...');
    
    // Now try the API
    const loginResponse = await axios.get(`${nasUrl}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 3,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('SID:', loginResponse.data.data.sid);
      console.log('\n🎉 Connection working!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSynologyAPI();
