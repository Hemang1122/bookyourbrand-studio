import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting NAS upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = (formData.get('clientName') as string) || 'Unknown';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 File:', file.name, 'Size:', file.size, 'Client:', clientName);

    // Step 1: Login with detailed error logging
    const loginParams = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: NAS_USER,
      passwd: NAS_PASS,
      session: 'FileStation',
      format: 'sid'
    });

    console.log('🔐 Attempting login to:', NAS_URL);
    console.log('👤 Username:', NAS_USER);
    
    const loginResponse = await fetch(`${NAS_URL}/webapi/auth.cgi?${loginParams.toString()}`, { 
      method: 'GET',
      // @ts-ignore
      agent: httpsAgent 
    });
    
    const loginData = await loginResponse.json();
    console.log('📥 Login response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      const errorCodes: Record<number, string> = {
        400: 'No such account or incorrect password',
        401: 'Account disabled',
        402: 'Permission denied',
        403: '2-step verification code required',
        404: 'Failed to authenticate 2-step verification code',
        408: 'No such account or incorrect password',
        409: 'Account locked'
      };
      
      const errorCode = loginData.error?.code || 'unknown';
      const errorMessage = errorCodes[errorCode] || `Error code: ${errorCode}`;
      
      console.error('❌ Login failed:', errorMessage);
      
      return NextResponse.json({ 
        success: false, 
        error: `NAS Login Failed: ${errorMessage}. Please check NAS credentials.` 
      }, { status: 401 });
    }

    const sid = loginData.data.sid;
    console.log('✅ Login successful! SID:', sid.substring(0, 30) + '...');

    // Step 2: Upload file
    const uploadPath = `/CRM-Uploads/${clientName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const boundary = `----FormBoundary${Math.random().toString(36).substring(2)}`;
    const chunks: Buffer[] = [];

    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="api"\r\n\r\nSYNO.FileStation.Upload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="version"\r\n\r\n2\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="method"\r\n\r\nupload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="path"\r\n\r\n${uploadPath}\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="create_parents"\r\n\r\ntrue\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`));
    chunks.push(buffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(chunks);

    console.log('📤 Uploading to path:', uploadPath);

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
    console.log('📥 Upload response:', JSON.stringify(uploadData, null, 2));

    if (!uploadData.success) {
      return NextResponse.json({ 
        success: false, 
        error: `Upload failed: ${JSON.stringify(uploadData)}` 
      }, { status: 500 });
    }

    console.log('✅ File uploaded successfully!');

    // Step 3: Create share link (optional)
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
      console.log('⚠️ Share link creation failed (non-critical)');
    }

    // Logout
    try {
      await fetch(`${NAS_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=logout&session=FileStation&_sid=${sid}`, {
        // @ts-ignore
        agent: httpsAgent
      });
      console.log('✅ Logged out');
    } catch (e) {
      console.log('⚠️ Logout failed (non-critical)');
    }

    return NextResponse.json({
      success: true,
      nasPath: filePath,
      shareUrl: shareUrl,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
