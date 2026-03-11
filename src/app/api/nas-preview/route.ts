import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import axios from 'axios';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let cachedSid: string | null = null;

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function getSession(): Promise<string> {
  cachedSid = null; // Always fresh session for downloads
  const res = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
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
  if (!res.data.success) throw new Error('NAS login failed');
  cachedSid = res.data.data.sid;
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
    const nasUrl = `${NAS_URL}/webapi/entry.cgi`;
    
    console.log('Downloading from NAS for preview:', filePath);

    const fileRes = await axios.get(nasUrl, {
      params: {
        api: 'SYNO.FileStation.Download',
        version: 2,
        method: 'download',
        path: filePath,
        mode: 'download',
        _sid: sid
      },
      responseType: 'arraybuffer',
      httpsAgent
    });

    const contentType = fileRes.headers['content-type'] || 'application/octet-stream';
    const fileName = filePath.split('/').pop() || 'download';

    console.log('File buffered for preview, size:', fileRes.data.byteLength);

    return new NextResponse(fileRes.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(fileRes.data.byteLength),
        'Cache-Control': 'private, max-age=3600',
      }
    });

  } catch (error: any) {
    console.error('Preview error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
