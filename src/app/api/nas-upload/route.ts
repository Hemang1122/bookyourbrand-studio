import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const agent = new https.Agent({ rejectUnauthorized: false });

let cachedSid: string | null = null;

async function getSession() {
  if (cachedSid) return cachedSid;
  const res = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
    params: { api: 'SYNO.API.Auth', version: 6, method: 'login', account: USERNAME, passwd: PASSWORD, session: 'FileStation', format: 'sid' },
    httpsAgent: agent
  });
  if (!res.data.success) { cachedSid = null; throw new Error('NAS login failed'); }
  cachedSid = res.data.data.sid;
  return cachedSid!;
}

async function generateShareLink(sid: string, filePath: string): Promise<string | null> {
  try {
    const res = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
      params: {
        api: 'SYNO.FileStation.Sharing',
        version: 3,
        method: 'create',
        path: filePath,
        password: '',
        date_expired: '-1',
        date_available: '-1',
        _sid: sid
      },
      httpsAgent: agent
    });

    if (res.data.success && res.data.data?.links?.[0]?.url) {
      return res.data.data.links[0].url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const clientName = formData.get('clientName') as string;

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' });

    const sid = await getSession();
    const uploadPath = `/CLIENT FILES/${clientName}`;
    const filePath = `${uploadPath}/${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const form = new FormData();
    form.append('api', 'SYNO.FileStation.Upload');
    form.append('version', '2');
    form.append('method', 'upload');
    form.append('path', uploadPath);
    form.append('create_parents', 'true');
    form.append('overwrite', 'true');
    form.append('file', fileBuffer, { filename: file.name, contentType: file.type });

    const res = await axios.post(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, form, {
      headers: form.getHeaders(),
      httpsAgent: agent,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    if (res.data.success) {
      // Generate sharing link
      const shareUrl = await generateShareLink(sid, filePath);
      return NextResponse.json({ 
        success: true, 
        nasPath: filePath,
        shareUrl: shareUrl || null,
        fileName: file.name,
        fileType: file.type
      });
    } else {
      cachedSid = null;
      return NextResponse.json({ success: false, error: JSON.stringify(res.data) });
    }
  } catch (error: any) {
    cachedSid = null;
    return NextResponse.json({ success: false, error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};
