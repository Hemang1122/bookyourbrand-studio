import axios from 'axios';
import FormData from 'form-data';

const NAS_URL = 'https://bybvasai.quickconnect.to';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

export async function nasLogin() {
  try {
    const response = await axios.post(`${NAS_URL}/webapi/auth.cgi`, null, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'cookie'
      }
    });

    if (response.data?.success) {
      return response.data.data.sid;
    }
    throw new Error(`NAS Login failed: ${JSON.stringify(response.data?.error)}`);
  } catch (error: any) {
    console.error('NAS Login Error:', error.message);
    throw error;
  }
}

export async function nasUploadFile(sid: string, folderPath: string, fileName: string, fileBuffer: Buffer) {
  const form = new FormData();
  form.append('api', 'SYNO.FileStation.Upload');
  form.append('version', '2');
  form.append('method', 'upload');
  form.append('path', folderPath);
  form.append('create_parents', 'true');
  form.append('overwrite', 'true');
  form.append('file', fileBuffer, { filename: fileName });

  try {
    const response = await axios.post(`${NAS_URL}/webapi/entry.cgi`, form, {
      params: { _sid: sid },
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error: any) {
    console.error('NAS Upload Error:', error.message);
    throw error;
  }
}

export async function nasLogout(sid: string) {
  try {
    await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'logout',
        session: 'FileStation'
      },
      headers: { Cookie: `id=${sid}` }
    });
  } catch (error: any) {
    console.debug('NAS Logout silent fail:', error.message);
  }
}
