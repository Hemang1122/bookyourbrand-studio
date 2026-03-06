const axios = require('axios');

const NAS_URL = 'https://bybvasai.quickconnect.to';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

async function testDirectConnection() {
  try {
    console.log('🔐 Testing direct QuickConnect URL...');
    console.log('URL:', NAS_URL);
    
    // Try direct login through QuickConnect
    const loginResponse = await axios.post(`${NAS_URL}/webapi/auth.cgi`, null, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'cookie'
      },
      maxRedirects: 5,
      validateStatus: () => true // Accept any status
    });
    
    console.log('\n📥 Response Status:', loginResponse.status);
    console.log('📥 Response Headers:', loginResponse.headers);
    console.log('📥 Response Data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data && loginResponse.data.success) {
      const sid = loginResponse.data.data.sid;
      console.log('\n✅ Login successful!');
      console.log('SID:', sid);
      
      // Test file upload
      console.log('\n📤 Testing file upload...');
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('api', 'SYNO.FileStation.Upload');
      form.append('version', '2');
      form.append('method', 'upload');
      form.append('path', '/CRM-Uploads');
      form.append('create_parents', 'true');
      form.append('overwrite', 'true');
      form.append('file', Buffer.from('test content'), {
        filename: 'test.txt',
        contentType: 'text/plain'
      });
      
      const uploadResponse = await axios.post(
        `${NAS_URL}/webapi/entry.cgi`,
        form,
        {
          params: { _sid: sid },
          headers: form.getHeaders()
        }
      );
      
      console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
      
      if (uploadResponse.data.success) {
        console.log('✅ Upload successful!');
      }
      
      // Logout
      await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
        params: {
          api: 'SYNO.API.Auth',
          version: 6,
          method: 'logout',
          session: 'FileStation'
        },
        headers: { Cookie: `id=${sid}` }
      });
      
      console.log('\n🎉 Everything works! Ready to integrate into CRM!');
      
    } else {
      console.log('\n❌ Login failed');
      console.log('Error:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDirectConnection();
