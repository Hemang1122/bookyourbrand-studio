const axios = require('axios');
const https = require('https');

const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

// Common Synology ports
const PORTS_TO_TRY = [
  { port: 5001, protocol: 'https' },  // Default DSM HTTPS
  { port: 8080, protocol: 'https' },  // Your current port
  { port: 5000, protocol: 'http' },   // Default DSM HTTP
  { port: 443, protocol: 'https' }    // Standard HTTPS
];

async function testAllPorts() {
  for (const { port, protocol } of PORTS_TO_TRY) {
    const url = `${protocol}://byb.i234.me:${port}`;
    console.log(`\n🔐 Testing ${protocol.toUpperCase()} on port ${port}...`);
    console.log('URL:', url);
    
    try {
      const config = {
        params: {
          api: 'SYNO.API.Auth',
          version: 6,
          method: 'login',
          account: USERNAME,
          passwd: PASSWORD,
          session: 'FileStation',
          format: 'sid'
        },
        timeout: 5000,
        validateStatus: () => true
      };
      
      // Add HTTPS agent if needed
      if (protocol === 'https') {
        config.httpsAgent = new https.Agent({ 
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        });
      }
      
      const response = await axios.get(`${url}/webapi/auth.cgi`, config);
      
      console.log('Status:', response.status);
      
      if (response.data && typeof response.data === 'object') {
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
          console.log('\n✅✅✅ SUCCESS! ✅✅✅');
          console.log('Working URL:', url);
          console.log('SID:', response.data.data.sid);
          console.log('\n🎉 Use this URL in your CRM!');
          return;
        }
      } else {
        console.log('Response (first 200 chars):', String(response.data).substring(0, 200));
      }
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
  
  console.log('\n❌ None of the ports worked.');
  console.log('Please verify:');
  console.log('1. The correct domain/IP: byb.i234.me');
  console.log('2. Which port DSM is running on');
  console.log('3. Firewall settings');
}

testAllPorts();
