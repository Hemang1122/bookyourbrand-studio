const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

const NAS_URL = 'https://byb.i234.me:8080';
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

  // Upload to CLIENT FILES
  const form = new FormData();
  form.append('api', 'SYNO.FileStation.Upload');
  form.append('version', '2');
  form.append('method', 'upload');
  form.append('path', '/CLIENT FILES');
  form.append('create_parents', 'true');
  form.append('overwrite', 'true');
  form.append('file', Buffer.from('Test upload from CRM - ' + new Date().toISOString()), {
    filename: 'crm-test.txt',
    contentType: 'text/plain'
  });

  const uploadRes = await axios.post(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, form, {
    headers: form.getHeaders(),
    httpsAgent: agent
  });

  console.log('📤 Upload Response:', JSON.stringify(uploadRes.data, null, 2));
  if (uploadRes.data.success) {
    console.log('✅ File uploaded successfully to /CLIENT FILES!');
  } else {
    console.log('❌ Failed - trying /home folder...');

    // Try home folder
    const form2 = new FormData();
    form2.append('api', 'SYNO.FileStation.Upload');
    form2.append('version', '2');
    form2.append('method', 'upload');
    form2.append('path', '/home/crm-uploads');
    form2.append('create_parents', 'true');
    form2.append('overwrite', 'true');
    form2.append('file', Buffer.from('Test upload from CRM - ' + new Date().toISOString()), {
      filename: 'crm-test.txt',
      contentType: 'text/plain'
    });

    const uploadRes2 = await axios.post(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, form2, {
      headers: form2.getHeaders(),
      httpsAgent: agent
    });

    console.log('📤 Home Upload Response:', JSON.stringify(uploadRes2.data, null, 2));
    if (uploadRes2.data.success) {
      console.log('✅ File uploaded successfully to /home/crm-uploads!');
    }
  }
}

main().catch(console.error);
