import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import axios from 'axios';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    console.log('📥 Downloading file:', filePath);

    // Login to NAS
    const loginResponse = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      httpsAgent
    });

    if (!loginResponse.data.success) {
      console.error('❌ NAS login failed:', loginResponse.data);
      return NextResponse.json({ error: 'NAS login failed' }, { status: 401 });
    }

    const sid = loginResponse.data.data.sid;
    console.log('✅ NAS login successful');

    // Download file from NAS
    const downloadUrl = `${NAS_URL}/webapi/entry.cgi`;
    const fileResponse = await axios.get(downloadUrl, {
      params: {
        api: 'SYNO.FileStation.Download',
        version: 2,
        method: 'download',
        path: filePath,
        mode: 'download',
        _sid: sid
      },
      responseType: 'stream',
      httpsAgent
    });

    // Extract filename from path
    const fileName = filePath.split('/').pop() || 'download';
    console.log('✅ File download stream initiated:', fileName);

    // Get content type from response or default
    const contentType = fileResponse.headers['content-type'] || 'application/octet-stream';

    // Stream file to client
    return new NextResponse(fileResponse.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ Download error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
