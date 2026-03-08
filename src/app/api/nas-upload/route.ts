import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({ 
  rejectUnauthorized: false 
});

let cachedSid: string | null = null;

async function getSession() {
  if (cachedSid) return cachedSid;
  const loginResponse = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
    params: {
      api: 'SYNO.API.Auth',
      version: 6,
      method: 'login',
      account: NAS_USER,
      passwd: NAS_PASS,
      session: 'FileStation',
      format: 'sid'
    },
    httpsAgent
  });

  if (!loginResponse.data.success) {
    throw new Error('NAS login failed: ' + JSON.stringify(loginResponse.data));
  }

  cachedSid = loginResponse.data.data.sid;
  return cachedSid!;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = formData.get('clientName') as string;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 Uploading:', file.name, 'for client:', clientName);

    const sid = await getSession();
    console.log('✅ NAS session active');

    // Step 2: Create folder structure and upload
    const uploadPath = `/CRM-Uploads/${clientName}/${projectId}`;
    const nasFormData = new FormData();
    
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
        httpsAgent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (!uploadResponse.data.success) {
      cachedSid = null; // Reset session on failure
      throw new Error(`Upload failed: ${JSON.stringify(uploadResponse.data)}`);
    }

    console.log('✅ File uploaded to NAS');

    // Step 3: Create share link
    const filePath = `${uploadPath}/${file.name}`;
    let shareUrl = null;

    try {
      const shareResponse = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
        params: {
          api: 'SYNO.FileStation.Sharing',
          version: 3,
          method: 'create',
          path: filePath,
          _sid: sid
        },
        httpsAgent
      });

      if (shareResponse.data.success && shareResponse.data.data?.links?.[0]) {
        shareUrl = shareResponse.data.data.links[0].url;
        console.log('✅ Share link created');
      }
    } catch (error) {
      console.log('⚠️ Share link creation failed (file still uploaded)');
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
