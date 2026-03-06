const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const agent = new https.Agent({ rejectUnauthorized: false });

async function main() {
  // Login
  const loginRes = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
    params: { api: 'SYNO.API.Auth', version: 6, method: 'login', account: USERNAME, passwd: PASSWORD, session: 'FileStation', format: 'sid' },
    httpsAgent: agent
  });
  const sid = loginRes.data.data.sid;
  console.log('✅ Logged in!');

  // First list available folders to see what we have access to
  const listRes = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
    params: {
      api: 'SYNO.FileStation.List',
      version: 2,
      method: 'list_share',
      _sid: sid
    },
    httpsAgent: agent
  });
  console.log('📁 Available folders:', JSON.stringify(listRes.data, null, 2));
}

main().catch(console.error);
