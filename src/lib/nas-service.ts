import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';
const agent = new https.Agent({ rejectUnauthorized: false });

let cachedSid: string | null = null;

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
    httpsAgent: agent
  });

  if (!res.data.success) throw new Error('NAS login failed');
  cachedSid = res.data.data.sid;
  return cachedSid!;
}

export async function uploadFileToNAS(
  fileBuffer: Buffer,
  fileName: string,
  clientName: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const sid = await getSession();
    const uploadPath = `/CLIENT FILES/${clientName}`;

    const form = new FormData();
    form.append('api', 'SYNO.FileStation.Upload');
    form.append('version', '2');
    form.append('method', 'upload');
    form.append('path', uploadPath);
    form.append('create_parents', 'true');
    form.append('overwrite', 'true');
    form.append('file', fileBuffer, { filename: fileName });

    const res = await axios.post(`${NAS_URL}/webapi/entry.cgi?_sid=${sid}`, form, {
      headers: form.getHeaders(),
      httpsAgent: agent
    });

    if (res.data.success) {
      return { success: true, path: `${uploadPath}/${fileName}` };
    } else {
      cachedSid = null; // Reset session on error
      return { success: false, error: `Upload failed: ${JSON.stringify(res.data)}` };
    }
  } catch (error: any) {
    cachedSid = null;
    return { success: false, error: error.message };
  }
}

export async function listClientFiles(clientName: string) {
  try {
    const sid = await getSession();
    const res = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
      params: {
        api: 'SYNO.FileStation.List',
        version: 2,
        method: 'list',
        folder_path: `/CLIENT FILES/${clientName}`,
        _sid: sid
      },
      httpsAgent: agent
    });
    return res.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
