import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import Busboy from 'busboy';
import { Readable, PassThrough } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

let cachedSid: string | null = null;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getSession(): Promise<string> {
  if (cachedSid) return cachedSid;
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

function sanitizeFileName(name: string): string {
  return name
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // remove emojis
    .replace(/[^\w\s.\-()]/g, '_')           // replace special chars
    .replace(/\s+/g, ' ')                     // normalize spaces
    .trim();
}

function parseMultipart(req: NextRequest, contentType: string): Promise<{
  fileBuffer: Buffer; fileName: string; clientName: string;
  folderName: string; mimeType: string; chunkIndex: number; totalChunks: number;
}> {
  return new Promise(async (resolve, reject) => {
    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: { fileSize: 500 * 1024 * 1024 } // Support up to 500MB
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
    
    // Convert Web ReadableStream to Node Readable
    const reader = req.body?.getReader();
    if (reader) {
      const stream = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        }
      });
      stream.pipe(busboy);
    } else {
      reject(new Error('Request body is empty'));
    }
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
  
  const uploadRes = await axios.post(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, body, {
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    httpsAgent,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return uploadRes.data;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data' });
    }

    const { fileBuffer, fileName, clientName, folderName, mimeType, chunkIndex, totalChunks } =
      await parseMultipart(req, contentType);

    const safeFileName = sanitizeFileName(fileName);
    const uploadPath = folderName
      ? `/CLIENT FILES/${clientName}/${folderName}`
      : `/CLIENT FILES/${clientName}`;
    const filePath = `${uploadPath}/${safeFileName}`;

    // Use /tmp to store chunks persistently on this instance
    const tmpDir = path.join('/tmp', 'uploads', `${clientName}_${folderName}_${safeFileName}`.replace(/[^a-zA-Z0-9_]/g, '_'));
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const chunkFile = path.join(tmpDir, `chunk_${String(chunkIndex).padStart(6, '0')}`);
    fs.writeFileSync(chunkFile, fileBuffer);

    // Count how many chunks we have
    const existingChunks = fs.readdirSync(tmpDir).filter(f => f.startsWith('chunk_')).length;

    if (existingChunks < totalChunks) {
      return NextResponse.json({ success: true, chunkIndex, done: false });
    }

    // All chunks saved - read and merge
    const chunkFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('chunk_'))
      .sort();

    // Create a buffer for the complete file (OOM danger for extremely large files, but 500MB should pass)
    const completeFile = Buffer.concat(chunkFiles.map(f => fs.readFileSync(path.join(tmpDir, f))));

    // Clean up tmp
    fs.rmSync(tmpDir, { recursive: true, force: true });

    const sid = await getSession();
    const result = await uploadCompleteFileToNAS(sid, completeFile, safeFileName, mimeType, uploadPath);

    if (!result.success) {
      cachedSid = null;
      return NextResponse.json({ success: false, error: JSON.stringify(result) });
    }

    return NextResponse.json({ success: true, nasPath: filePath, shareUrl: null, fileName: safeFileName, done: true });

  } catch (error: any) {
    cachedSid = null;
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
