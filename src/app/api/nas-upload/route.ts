
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
  const res = await fetch(`${NAS_URL}/webapi/auth.cgi?${params}`, { agent: httpsAgent } as any);
  const data = await res.json();
  if (!data.success) throw new Error('NAS login failed');
  cachedSid = data.data.sid;
  return cachedSid!;
}

function parseMultipart(req: NextRequest, contentType: string): Promise<{ fileBuffer: Buffer; fileName: string; clientName: string; folderName: string; mimeType: string; chunkIndex: number; totalChunks: number }> {
  return new Promise(async (resolve, reject) => {
    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB per chunk
    });

    let fileName = 'upload';
    let clientName = 'Unknown Client';
    let folderName = '';
    let mimeType = 'application/octet-stream';
    let chunkIndex = 0;
    let totalChunks = 1;
    const chunks: Buffer[] = [];
    let fileReceived = false;

    busboy.on('file', (fieldname, file, info) => {
      fileReceived = true;
      fileName = info.filename || 'upload';
      mimeType = info.mimeType || 'application/octet-stream';
      file.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      file.on('error', reject);
    });

    busboy.on('field', (fieldname, value) => {
      if (fieldname === 'clientName') clientName = value;
      if (fieldname === 'folderName') folderName = value;
      if (fieldname === 'chunkIndex') chunkIndex = parseInt(value);
      if (fieldname === 'totalChunks') totalChunks = parseInt(value);
    });

    busboy.on('finish', () => {
      if (!fileReceived || chunks.length === 0) return reject(new Error('No file received'));
      resolve({ fileBuffer: Buffer.concat(chunks), fileName, clientName, folderName, mimeType, chunkIndex, totalChunks });
    });

    busboy.on('error', reject);

    const body = await req.arrayBuffer();
    Readable.from(Buffer.from(body)).pipe(busboy);
  });
}

async function uploadChunkToNAS(sid: string, fileBuffer: Buffer, fileName: string, mimeType: string, uploadPath: string, chunkIndex: number, totalChunks: number) {
  const boundary = '----NASChunkBoundary' + Date.now();
  const chunks: Buffer[] = [];

  const addField = (name: string, value: string) => {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  };

  const tempFileName = totalChunks > 1 ? `${fileName}.part${chunkIndex}` : fileName;

  addField('api', 'SYNO.FileStation.Upload');
  addField('version', '2');
  addField('method', 'upload');
  addField('path', uploadPath);
  addField('create_parents', 'true');
  addField('overwrite', 'true');

  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${tempFileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  chunks.push(fileBuffer);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(chunks);

  const uploadRes = await fetch(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
    agent: httpsAgent
  } as any);

  return await uploadRes.json();
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data' });
    }

    const { fileBuffer, fileName, clientName, folderName, mimeType, chunkIndex, totalChunks } = await parseMultipart(req, contentType);
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} - File: ${fileName} Folder: ${folderName}`);

    const sid = await getSession();
    const uploadPath = folderName 
      ? `/CLIENT FILES/${clientName}/${folderName}`
      : `/CLIENT FILES/${clientName}`;
    const filePath = `${uploadPath}/${fileName}`;

    const uploadData = await uploadChunkToNAS(sid, fileBuffer, fileName, mimeType, uploadPath, chunkIndex, totalChunks);

    if (!uploadData.success) {
      cachedSid = null;
      return NextResponse.json({ success: false, error: JSON.stringify(uploadData) });
    }

    // Final chunk or single chunk upload completed
    if (chunkIndex === totalChunks - 1) {
      return NextResponse.json({ 
        success: true, 
        nasPath: filePath, 
        shareUrl: null, // Disable broken share links, use direct proxy instead
        fileName, 
        done: true 
      });
    }

    return NextResponse.json({ success: true, chunkIndex, done: false });

  } catch (error: any) {
    cachedSid = null;
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
