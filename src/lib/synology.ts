import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const QUICKCONNECT_ID = 'bybvasai';
const USERNAME = 'crm-uploads';
const PASSWORD = '0TYuOj>a';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Resolves the actual NAS URL from a QuickConnect ID.
 */
export async function resolveQuickConnect() {
  try {
    const response = await axios.get(
      `https://global.quickconnect.to/Serv.php`,
      {
        params: {
          id: QUICKCONNECT_ID,
          serverID: QUICKCONNECT_ID,
          type: 'relay'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const data = response.data;

    if (data && data.service) {
      const { host, port } = data.service;
      return `https://${host}:${port}`;
    }

    if (data && data.relay && data.relay.host) {
      return `https://${data.relay.host}:${data.relay.port || 443}`;
    }

    return null;
  } catch (error: any) {
    console.error('NAS Resolution Error:', error.message);
    return null;
  }
}

/**
 * Log in to the NAS and retrieve a session ID (sid).
 */
export async function nasLogin(nasUrl: string) {
  try {
    const response = await axios.get(`${nasUrl}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: USERNAME,
        passwd: PASSWORD,
        session: 'FileStation',
        format: 'sid'
      },
      timeout: 10000,
      httpsAgent
    });

    if (response.data && response.data.success) {
      return response.data.data.sid;
    }
    throw new Error(`NAS Login failed: ${JSON.stringify(response.data.error)}`);
  } catch (error: any) {
    console.error('NAS Login Error:', error.message);
    throw error;
  }
}

/**
 * Upload a file to a specific path on the NAS.
 */
export async function nasUploadFile(nasUrl: string, sid: string, folderPath: string, fileName: string, fileBuffer: Buffer) {
  const form = new FormData();
  form.append('api', 'SYNO.FileStation.Upload');
  form.append('version', '2');
  form.append('method', 'upload');
  form.append('path', folderPath);
  form.append('create_parents', 'true');
  form.append('overwrite', 'true');
  form.append('file', fileBuffer, { filename: fileName });

  try {
    const response = await axios.post(
      `${nasUrl}/webapi/entry.cgi?_sid=${sid}`,
      form,
      {
        headers: form.getHeaders(),
        httpsAgent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 1 minute timeout for uploads
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('NAS Upload Error:', error.message);
    throw error;
  }
}

/**
 * Log out and invalidate the session ID.
 */
export async function nasLogout(nasUrl: string, sid: string) {
  try {
    await axios.get(`${nasUrl}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'logout',
        session: 'FileStation',
        _sid: sid
      },
      httpsAgent
    });
  } catch (error: any) {
    console.debug('NAS Logout silent fail:', error.message);
  }
}
