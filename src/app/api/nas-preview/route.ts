import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let cachedSid: string | null = null;

async function getSession(): Promise<string> {
  if (cachedSid) return cachedSid;
  const params = new URLSearchParams({
    api: 'SYNO.API.Auth', version: '6', method: 'login',
    account: USERNAME, passwd: PASSWORD, session: 'FileStation', format: 'sid'
  });
  const res = await fetch(`${NAS_URL}/webapi/auth.cgi?${params}`, {
    agent: httpsAgent
  } as any);
  const data = await res.json();
  if (!data.success) throw new Error('NAS login failed');
  cachedSid = data.data.sid;
  return cachedSid!;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) return NextResponse.json({ error: 'No path provided' }, { status: 400 });

    // If it's a full NAS share URL, redirect directly
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
    const fileRes = await fetch(nasUrl, {
      agent: httpsAgent
    } as any);

    if (!fileRes.ok || !fileRes.body) {
      cachedSid = null;
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileRes.headers.get('content-length');
    const fileName = filePath.split('/').pop() || 'download';

    // Stream directly - no buffering!
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
      'Transfer-Encoding': 'chunked',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(fileRes.body as any, { headers });

  } catch (error: any) {
    cachedSid = null;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
