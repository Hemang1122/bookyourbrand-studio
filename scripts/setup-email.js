#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║  📧 BookYourBrands Email Setup Wizard   ║');
console.log('╚═══════════════════════════════════════════╝\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('This will configure Gmail for sending notifications.\n');
  
  // Step 1: Get email
  const email = await question('📮 Enter Gmail address (e.g., bookyourbrandscrm@gmail.com): ');
  
  // Step 2: Get app password
  console.log('\n🔐 To get an App Password:');
  console.log('   1. Go to: https://myaccount.google.com/apppasswords');
  console.log('   2. Create a new app password named "BYB CRM"');
  console.log('   3. Copy the 16-character password\n');
  
  const appPassword = await question('🔑 Paste your App Password here: ');
  
  // Step 3: Confirmation
  console.log('\n📋 Configuration Summary:');
  console.log('   Email: ' + email);
  console.log('   Password: ' + '*'.repeat(appPassword.length));
  
  const confirm = await question('\n✅ Save this configuration? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Setup cancelled.\n');
    rl.close();
    return;
  }
  
  // Step 4: Read existing .env.local or create new
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove old email config if exists
  envContent = envContent.replace(/GMAIL_USER=.*/g, '');
  envContent = envContent.replace(/GMAIL_APP_PASSWORD=.*/g, '');
  
  // Add new config
  const newConfig = `
# Email Configuration (Added by setup-email.js)
GMAIL_USER=${email}
GMAIL_APP_PASSWORD=${appPassword}
`;
  
  envContent = envContent.trim() + '\n' + newConfig;
  
  // Write to file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Email configuration saved to .env.local');
  console.log('\n🧪 Testing email connection...\n');
  
  // Test the configuration
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: appPassword,
      },
    });
    
    await transporter.verify();
    console.log('✅ Email connection successful!\n');
    console.log('🚀 Setup complete! You can now send emails.\n');
  } catch (error) {
    console.log('❌ Email connection failed:', error.message);
    console.log('⚠️  Please check your credentials and try again.\n');
  }
  
  rl.close();
}

setup().catch(console.error);
