import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let cachedSid: string | null = null;

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function getSession(): Promise<string> {
  cachedSid = null; // Always fresh session for downloads
  const params = new URLSearchParams({
    api: 'SYNO.API.Auth', version: '6', method: 'login',
    account: USERNAME, passwd: PASSWORD, session: 'FileStation', format: 'sid'
  });
  const res = await fetch(`${NAS_URL}/webapi/auth.cgi?${params}`, {
    agent: httpsAgent
  } as any);
  const data = await res.json();
  if (!data.success) throw new Error('NAS login failed: ' + JSON.stringify(data));
  cachedSid = data.data.sid;
  return cachedSid!;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) return NextResponse.json({ error: 'No path provided' }, { status: 400 });

    // If it's a full URL, redirect
    if (filePath.startsWith('http')) {
      return NextResponse.redirect(filePath);
    }

    const sid = await getSession();
    const params = new URLSearchParams({
      api: 'SYNO.FileStation.Download',
      version: '2',
      method: 'download',
      path: filePath,
      mode: 'download',
      _sid: sid
    });

    const nasUrl = `${NAS_URL}/webapi/entry.cgi?${params}`;
    console.log('Downloading from NAS:', filePath);

    const fileRes = await fetch(nasUrl, {
      agent: httpsAgent
    } as any);

    if (!fileRes.ok) {
      const text = await fileRes.text();
      console.error('NAS error:', fileRes.status, text);
      return NextResponse.json({ error: 'File not found on NAS', detail: text }, { status: 404 });
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    
    // Check if NAS returned JSON error instead of file
    if (contentType.includes('application/json')) {
      const json = await fileRes.json();
      console.error('NAS returned error JSON:', json);
      return NextResponse.json({ error: 'NAS error', detail: json }, { status: 404 });
    }

    const contentLength = fileRes.headers.get('content-length');
    const fileName = filePath.split('/').pop() || 'download';

    console.log('Fetching file, size:', contentLength, 'type:', contentType);
    
    // Buffer the file
    const buffer = await fileRes.arrayBuffer();
    console.log('File buffered, size:', buffer.byteLength);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=3600',
      }
    });

  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
