import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import Busboy from 'busboy';
import { Readable } from 'stream';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

let cachedSid: string | null = null;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getSession(): Promise<string> {
  if (cachedSid) return cachedSid;
  const params = new URLSearchParams({
    api: 'SYNO.API.Auth', version: '6', method: 'login',
    account: USERNAME, passwd: PASSWORD, session: 'FileStation', format: 'sid'
  });
  const res = await fetch(`${NAS_URL}/webapi/auth.cgi?${params}`, {
    // @ts-ignore
    agent: httpsAgent
  });
  const data = await res.json();
  if (!data.success) throw new Error('NAS login failed');
  cachedSid = data.data.sid;
  return cachedSid!;
}

function parseMultipart(req: NextRequest, contentType: string): Promise<{ fileBuffer: Buffer; fileName: string; clientName: string; mimeType: string }> {
  return new Promise(async (resolve, reject) => {
    const busboy = Busboy({ 
      headers: { 'content-type': contentType },
      limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
    });

    let fileBuffer: Buffer | null = null;
    let fileName = 'upload';
    let clientName = 'Unknown Client';
    let mimeType = 'application/octet-stream';
    const chunks: Buffer[] = [];

    busboy.on('file', (fieldname, file, info) => {
      fileName = info.filename || 'upload';
      mimeType = info.mimeType || 'application/octet-stream';
      file.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      file.on('error', reject);
    });

    busboy.on('field', (fieldname, value) => {
      if (fieldname === 'clientName') clientName = value;
    });

    busboy.on('finish', () => {
      if (!fileBuffer) return reject(new Error('No file received'));
      resolve({ fileBuffer, fileName, clientName, mimeType });
    });

    busboy.on('error', reject);

    // Feed request body to busboy
    const body = await req.arrayBuffer();
    const readable = Readable.from(Buffer.from(body));
    readable.pipe(busboy);
  });
}

async function generateShareLink(sid: string, filePath: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      api: 'SYNO.FileStation.Sharing', version: '3', method: 'create',
      path: filePath, password: '', date_expired: '-1', date_available: '-1', _sid: sid
    });
    // @ts-ignore
    const res = await fetch(`${NAS_URL}/webapi/entry.cgi?${params}`, { agent: httpsAgent });
    const data = await res.json();
    if (data.success && data.data?.links?.[0]?.url) return data.data.links[0].url;
    return null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data' });
    }

    const { fileBuffer, fileName, clientName, mimeType } = await parseMultipart(req, contentType);
    console.log('📁 File:', fileName, 'Size:', fileBuffer.length, 'Client:', clientName);

    const sid = await getSession();
    const uploadPath = `/CLIENT FILES/${clientName}`;
    const filePath = `${uploadPath}/${fileName}`;

    // Build multipart body manually for NAS
    const boundary = '----NASUploadBoundary' + Date.now();
    const chunks: Buffer[] = [];

    const addField = (name: string, value: string) => {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    };

    addField('api', 'SYNO.FileStation.Upload');
    addField('version', '2');
    addField('method', 'upload');
    addField('path', uploadPath);
    addField('create_parents', 'true');
    addField('overwrite', 'true');

    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
    chunks.push(fileBuffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(chunks);

    // @ts-ignore
    const uploadRes = await fetch(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
      // @ts-ignore
      agent: httpsAgent
    });

    const uploadData = await uploadRes.json();

    if (uploadData.success) {
      const shareUrl = await generateShareLink(sid, filePath);
      return NextResponse.json({ success: true, nasPath: filePath, shareUrl, fileName });
    } else {
      cachedSid = null;
      return NextResponse.json({ success: false, error: JSON.stringify(uploadData) });
    }
  } catch (error: any) {
    cachedSid = null;
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
