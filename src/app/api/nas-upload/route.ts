import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import Busboy from 'busboy';
import { Readable } from 'stream';

const NAS_URL = 'https://byb.i234.me:5001';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to parse multipart form data using busboy
async function parseFormData(request: NextRequest): Promise<{ file: Buffer; fileName: string; clientName: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const contentType = request.headers.get('content-type') || '';
      
      const busboy = Busboy({ headers: { 'content-type': contentType } });
      
      let fileBuffer: Buffer | null = null;
      let fileName = '';
      let clientName = 'Unknown';
      
      busboy.on('file', (fieldname, file, info) => {
        fileName = info.filename;
        const chunks: Buffer[] = [];
        
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });
      
      busboy.on('field', (fieldname, val) => {
        if (fieldname === 'clientName') clientName = val;
      });
      
      busboy.on('finish', () => {
        if (!fileBuffer || !fileName) {
          reject(new Error('No file received'));
        } else {
          resolve({ file: fileBuffer, fileName, clientName });
        }
      });
      
      busboy.on('error', (err) => {
        console.error('Busboy error:', err);
        reject(err);
      });
      
      // Convert request body to stream and pipe to busboy
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);
      stream.pipe(busboy);
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting NAS upload...');
    
    // Parse the multipart form data
    const { file, fileName, clientName } = await parseFormData(request);
    
    console.log('📁 File:', fileName, 'Size:', file.length, 'Client:', clientName);

    // Step 1: Login to NAS
    const loginParams = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: NAS_USER,
      passwd: NAS_PASS,
      session: 'FileStation',
      format: 'sid'
    });

    console.log('🔐 Logging in to NAS...');
    
    const loginResponse = await fetch(`${NAS_URL}/webapi/auth.cgi?${loginParams.toString()}`, { 
      method: 'GET',
      // @ts-ignore
      agent: httpsAgent 
    });
    
    const loginData = await loginResponse.json();
    
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
        error: `NAS Login Failed: ${errorMessage}` 
      }, { status: 401 });
    }

    const sid = loginData.data.sid;
    console.log('✅ Login successful!');

    // Step 2: Upload file to NAS
    const uploadPath = `/CRM-Uploads/${clientName}`;

    const boundary = `----FormBoundary${Math.random().toString(36).substring(2)}`;
    const chunks: Buffer[] = [];

    // Build multipart form data manually
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="api"\r\n\r\nSYNO.FileStation.Upload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="version"\r\n\r\n2\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="method"\r\n\r\nupload\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="path"\r\n\r\n${uploadPath}\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="create_parents"\r\n\r\ntrue\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n`));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
    chunks.push(file);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(chunks);

    console.log('📤 Uploading file to NAS...');

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

    console.log('✅ File uploaded successfully!');

    // Step 3: Create share link (optional)
    const filePath = `${uploadPath}/${fileName}`;
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
        console.log('✅ Share link created');
      }
    } catch (e) {
      console.log('⚠️ Share link creation failed (non-critical)');
    }

    // Step 4: Logout
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
      fileName: fileName
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
