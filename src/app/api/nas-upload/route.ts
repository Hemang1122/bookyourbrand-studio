import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

// Disable SSL verification for self-signed certificates (common on private NAS)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 NAS Upload API called');
    
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = (formData.get('clientName') as string) || 'Unknown';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 File:', file.name, '| Client:', clientName, '| Size:', file.size);

    // Step 1: Login to NAS
    const loginUrl = `${NAS_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=login&account=${encodeURIComponent(NAS_USER)}&passwd=${encodeURIComponent(NAS_PASS)}&session=FileStation&format=sid`;
    
    const loginResponse = await fetch(loginUrl, { 
      method: 'GET',
      // @ts-ignore - Next.js fetch accepts agent in Node environment
      agent: httpsAgent 
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return NextResponse.json({ 
        success: false, 
        error: `NAS login failed: ${JSON.stringify(loginData)}` 
      }, { status: 401 });
    }

    const sid = loginData.data.sid;
    console.log('✅ Login successful, SID:', sid.substring(0, 20) + '...');

    // Step 2: Upload file
    const uploadPath = `/CRM-Uploads/${clientName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create multipart form data manually for maximum compatibility
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const chunks: Buffer[] = [];

    // Add text fields
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="api"\r\n\r\nSYNO.FileStation.Upload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="version"\r\n\r\n2\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="method"\r\n\r\nupload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="path"\r\n\r\n${uploadPath}\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="create_parents"\r\n\r\ntrue\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n`));
    
    // Add file
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`));
    chunks.push(buffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(chunks);

    const uploadResponse = await fetch(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body: body,
      // @ts-ignore
      agent: httpsAgent
    });

    const uploadData = await uploadResponse.json();

    if (!uploadData.success) {
      console.error('❌ Upload failed:', uploadData);
      return NextResponse.json({ 
        success: false, 
        error: `Upload failed: ${JSON.stringify(uploadData)}` 
      }, { status: 500 });
    }

    console.log('✅ Upload successful!');

    // Step 3: Try to create share link (optional)
    const filePath = `${uploadPath}/${file.name}`;
    let shareUrl = null;

    try {
      const shareParams = new URLSearchParams({
        api: 'SYNO.FileStation.Sharing',
        version: '3',
        method: 'create',
        path: filePath,
        _sid: sid
      });

      const shareResponse = await fetch(`${NAS_URL}/webapi/entry.cgi?${shareParams}`, {
        // @ts-ignore
        agent: httpsAgent
      });
      const shareData = await shareResponse.json();

      if (shareData.success && shareData.data?.links?.[0]?.url) {
        shareUrl = shareData.data.links[0].url;
        console.log('✅ Share link created:', shareUrl);
      }
    } catch (e) {
      console.log('⚠️ Share link failed (non-critical)');
    }

    // Logout
    try {
      await fetch(`${NAS_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=logout&session=FileStation&_sid=${sid}`, {
        // @ts-ignore
        agent: httpsAgent
      });
    } catch (e) {
      // Ignore logout errors
    }

    return NextResponse.json({
      success: true,
      nasPath: filePath,
      shareUrl: shareUrl,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('❌ NAS Upload Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}