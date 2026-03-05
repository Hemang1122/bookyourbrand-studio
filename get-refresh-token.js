const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '591545373912-lilon033d8nqg1h0rm165fli98k1nl62.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n📧 Gmail OAuth2 Setup\n');
console.log('1. Open this URL in your browser:');
console.log('\n' + authUrl + '\n');
console.log('2. Authorize the app');
console.log('3. Copy the code from the browser');
console.log('4. Paste it below\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code here: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ Error retrieving token:', err);
      return;
    }
    console.log('\n✅ SUCCESS! Your refresh token:\n');
    console.log(token.refresh_token);
    console.log('\n📋 Save this token - you will need it!\n');
  });
});
