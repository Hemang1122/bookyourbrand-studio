import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import axios from 'axios';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const dynamic = 'force-dynamic';

async function getSession(): Promise<string> {
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
  return res.data.data.sid;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) return NextResponse.json({ error: 'No path' }, { status: 400 });

    const sid = await getSession();
    const nasDownloadUrl = `${NAS_URL}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(filePath)}&mode=download&_sid=${sid}`;

    return NextResponse.redirect(nasDownloadUrl);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
