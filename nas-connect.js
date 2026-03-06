const axios = require('axios');

const QUICKCONNECT_ID = 'bybvasai';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function resolveQuickConnect(quickconnectId) {
  try {
    console.log('🔍 Resolving QuickConnect ID...');
    const response = await axios.post('https://global.quickconnect.to/Serv.php', {
      version: 1,
      command: 'get_server_info',
      stop_when_error: false,
      stop_when_success: false,
      id: 'dsm_portal_https',
      serverID: quickconnectId,
      is_gofile: false
    });
    
    const data = response.data;
    console.log('QuickConnect Response:', JSON.stringify(data, null, 2));
    
    if (data && data.server) {
      const { ddns, fqdn, external } = data.server;
      if (ddns && ddns !== 'NULL') return `https://${ddns}:5001`;
      if (fqdn && fqdn !== 'NULL') return `https://${fqdn}:5001`;
      if (external && external.ip) return `https://${external.ip}:5001`;
    }
    return null;
  } catch (error) {
    console.error('❌ Resolve error:', error.message);
    return null;
  }
}

async function loginToNAS(nasUrl) {
  try {
    console.log(`\n🔐 Logging in to: ${nasUrl}`);
    const response = await axios.get(`${nasUrl}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      timeout: 15000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    console.log('Login Response:', JSON.stringify(response.data, null, 2));
    if (response.data && response.data.success) {
      console.log('✅ Login successful!');
      return response.data.data.sid;
    } else {
      console.log('❌ Login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function main() {
  const nasUrl = await resolveQuickConnect(QUICKCONNECT_ID);
  if (!nasUrl) {
    console.error('❌ Could not resolve QuickConnect ID!');
    return;
  }
  console.log('✅ NAS URL resolved:', nasUrl);
  const sid = await loginToNAS(nasUrl);
  if (!sid) return;
  console.log('\n🎉 Connection successful! SID:', sid);
}

main();
