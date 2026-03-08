import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:8080';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = formData.get('clientName') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 Uploading file:', file.name, 'for client:', clientName);

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

    const loginResponse = await axios.get(`${NAS_URL}/webapi/auth.cgi?${loginParams}`, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    if (!loginResponse.data.success) {
      throw new Error('NAS login failed: ' + JSON.stringify(loginResponse.data.error));
    }

    const sid = loginResponse.data.data.sid;
    console.log('✅ NAS login successful');

    // Step 2: Upload file to NAS
    const uploadPath = `/CLIENT FILES/${clientName}`;
    const nasFormData = new FormData();
    
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    nasFormData.append('api', 'SYNO.FileStation.Upload');
    nasFormData.append('version', '2');
    nasFormData.append('method', 'upload');
    nasFormData.append('path', uploadPath);
    nasFormData.append('create_parents', 'true');
    nasFormData.append('overwrite', 'true');
    nasFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type || 'application/octet-stream'
    });

    const uploadResponse = await axios.post(
      `${NAS_URL}/webapi/entry.cgi?_sid=${sid}`,
      nasFormData,
      {
        headers: nasFormData.getHeaders(),
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (!uploadResponse.data.success) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadResponse.data)}`);
    }

    console.log('✅ File uploaded successfully');

    // Step 3: Create share link
    const filePath = `${uploadPath}/${file.name}`;
    let shareUrl = null;

    try {
      const shareParams = new URLSearchParams({
        api: 'SYNO.FileStation.Sharing',
        version: '3',
        method: 'create',
        path: filePath,
        password: '',
        date_expired: '-1',
        date_available: '-1',
        _sid: sid
      });

      const shareResponse = await axios.get(`${NAS_URL}/webapi/entry.cgi?${shareParams}`, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      if (shareResponse.data.success && shareResponse.data.data?.links?.[0]?.url) {
        shareUrl = shareResponse.data.data.links[0].url;
        console.log('✅ Share link created:', shareUrl);
      }
    } catch (error) {
      console.log('⚠️ Share link creation failed, file still uploaded');
    }

    // Step 4: Logout
    try {
      await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
        params: {
          api: 'SYNO.API.Auth',
          version: '6',
          method: 'logout',
          session: 'FileStation',
          _sid: sid
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
    } catch (error) {
      console.log('⚠️ Logout failed (non-critical)');
    }

    return NextResponse.json({
      success: true,
      nasPath: filePath,
      shareUrl: shareUrl,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
