import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

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
    const loginParams = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: USERNAME,
      passwd: PASSWORD,
      session: 'FileStation',
      format: 'sid'
    });

    const loginResponse = await fetch(`${NAS_URL}/webapi/auth.cgi?${loginParams}`, {
      // @ts-ignore
      agent: httpsAgent
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ NAS login failed:', loginData);
      return NextResponse.json({ error: 'NAS login failed' }, { status: 401 });
    }

    const sid = loginData.data.sid;
    console.log('✅ NAS login successful');

    // Download file from NAS
    const downloadParams = new URLSearchParams({
      api: 'SYNO.FileStation.Download',
      version: '2',
      method: 'download',
      path: filePath,
      mode: 'download',
      _sid: sid
    });

    console.log('📤 Fetching file from NAS...');

    const fileResponse = await fetch(`${NAS_URL}/webapi/entry.cgi?${downloadParams}`, {
      // @ts-ignore
      agent: httpsAgent
    });

    if (!fileResponse.ok) {
      console.error('❌ Download failed:', fileResponse.status);
      return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }

    // Extract filename from path
    const fileName = filePath.split('/').pop() || 'download';
    console.log('✅ File downloaded:', fileName);

    // Get content type from response or default
    const contentType = fileResponse.headers.get('Content-Type') || 'application/octet-stream';

    // Stream file to client
    return new NextResponse(fileResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
