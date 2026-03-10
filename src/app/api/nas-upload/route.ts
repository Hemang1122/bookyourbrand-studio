import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import Busboy from 'busboy';
import { Readable } from 'stream';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

export const maxDuration = 300;
export const config = { api: { bodyParser: false, responseLimit: "500mb" } };
export const dynamic = 'force-dynamic';

let cachedSid: string | null = null;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// In-memory chunk store: key = clientName/folderName/fileName
const chunkStore = new Map<string, { chunks: Buffer[], totalChunks: number, mimeType: string }>();

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
      limits: { fileSize: 50 * 1024 * 1024 }
    });
    let fileName = 'upload', clientName = 'Unknown Client', folderName = '', mimeType = 'application/octet-stream';
    let chunkIndex = 0, totalChunks = 1;
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

async function uploadCompleteFileToNAS(sid: string, fileBuffer: Buffer, fileName: string, mimeType: string, uploadPath: string) {
  const boundary = '----NASUploadBoundary' + Date.now();
  const parts: Buffer[] = [];
  const addField = (name: string, value: string) => {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  };
  addField('api', 'SYNO.FileStation.Upload');
  addField('version', '2');
  addField('method', 'upload');
  addField('path', uploadPath);
  addField('create_parents', 'true');
  addField('overwrite', 'true');
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);
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
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} - File: ${fileName}`);

    const uploadPath = folderName ? `/CLIENT FILES/${clientName}/${folderName}` : `/CLIENT FILES/${clientName}`;
    const filePath = `${uploadPath}/${fileName}`;
    const storeKey = `${clientName}/${folderName}/${fileName}`;

    // Single chunk - upload directly
    if (totalChunks === 1) {
      const sid = await getSession();
      const result = await uploadCompleteFileToNAS(sid, fileBuffer, fileName, mimeType, uploadPath);
      if (!result.success) { cachedSid = null; return NextResponse.json({ success: false, error: JSON.stringify(result) }); }
      return NextResponse.json({ success: true, nasPath: filePath, shareUrl: null, fileName, done: true });
    }

    // Multi-chunk: store in memory
    if (!chunkStore.has(storeKey)) {
      chunkStore.set(storeKey, { chunks: new Array(totalChunks), totalChunks, mimeType });
    }
    const store = chunkStore.get(storeKey)!;
    store.chunks[chunkIndex] = fileBuffer;

    const receivedCount = store.chunks.filter(Boolean).length;
    console.log(`Stored chunk ${chunkIndex + 1}/${totalChunks}, received ${receivedCount} so far`);

    if (receivedCount < totalChunks) {
      return NextResponse.json({ success: true, chunkIndex, done: false });
    }

    // All chunks received - merge and upload as ONE file
    console.log(`All chunks received for ${fileName}, merging (${(Buffer.concat(store.chunks).length / 1024 / 1024).toFixed(1)} MB)...`);
    const completeFile = Buffer.concat(store.chunks);
    chunkStore.delete(storeKey);

    const sid = await getSession();
    const result = await uploadCompleteFileToNAS(sid, completeFile, fileName, mimeType, uploadPath);
    if (!result.success) { cachedSid = null; return NextResponse.json({ success: false, error: JSON.stringify(result) }); }

    console.log(`Successfully uploaded: ${fileName}`);
    return NextResponse.json({ success: true, nasPath: filePath, shareUrl: null, fileName, done: true });

  } catch (error: any) {
    cachedSid = null;
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
