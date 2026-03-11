import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const NAS_URL = 'https://byb.i234.me:5001';
const NAS_USER = 'crm-uploads';
const NAS_PASS = '0TYuOj>a';

const httpsAgent = new https.Agent({ 
  rejectUnauthorized: false 
});

// CRITICAL: Set max duration to prevent timeout on large files
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = formData.get('clientName') as string;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log('📁 Uploading:', file.name, 'Size:', fileSizeMB, 'MB');

    // Reject files over 500MB to prevent server crashes
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum 500MB. Please compress the video.' 
      }, { status: 413 });
    }

    // Step 1: Login to NAS
    console.log('🔐 Logging into NAS...');
    const loginResponse = await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: NAS_USER,
        passwd: NAS_PASS,
        session: 'FileStation',
        format: 'sid'
      },
      httpsAgent,
      timeout: 30000 // 30 second timeout for login
    });

    if (!loginResponse.data.success) {
      console.error('❌ NAS login failed:', loginResponse.data);
      throw new Error('NAS authentication failed');
    }

    const sid = loginResponse.data.data.sid;
    console.log('✅ NAS login successful, SID:', sid.substring(0, 20) + '...');

    // Step 2: Convert file to buffer
    console.log('📦 Converting file to buffer...');
    const startTime = Date.now();
    const buffer = Buffer.from(await file.arrayBuffer());
    const conversionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Buffer created in ${conversionTime}s, size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Step 3: Upload to NAS
    const uploadPath = `/CRM-Uploads/${clientName}/${projectId}`;
    const nasFormData = new FormData();
    
    nasFormData.append('api', 'SYNO.FileStation.Upload');
    nasFormData.append('version', '2');
    nasFormData.append('method', 'upload');
    nasFormData.append('path', uploadPath);
    nasFormData.append('create_parents', 'true');
    nasFormData.append('overwrite', 'true');
    nasFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type || 'application/octet-stream'
    });

    console.log('📤 Uploading to NAS path:', uploadPath);
    const uploadStartTime = Date.now();

    const uploadResponse = await axios.post(
      `${NAS_URL}/webapi/entry.cgi?_sid=${sid}`,
      nasFormData,
      {
        headers: nasFormData.getHeaders(),
        httpsAgent,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000, // 10 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (percentCompleted % 25 === 0) { // Log every 25%
              console.log(`📊 Upload progress: ${percentCompleted}%`);
            }
          }
        }
      }
    );

    const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
    console.log(`✅ Upload completed in ${uploadTime}s`);

    if (!uploadResponse.data.success) {
      console.error('❌ Upload failed:', uploadResponse.data);
      throw new Error('Upload to NAS failed: ' + JSON.stringify(uploadResponse.data));
    }

    console.log('✅ File uploaded successfully to NAS');

    // Step 4: Create share link
    const filePath = `${uploadPath}/${file.name}`;
    let shareUrl = null;

    try {
      console.log('🔗 Creating share link...');
      const shareResponse = await axios.get(`${NAS_URL}/webapi/entry.cgi`, {
        params: {
          api: 'SYNO.FileStation.Sharing',
          version: 3,
          method: 'create',
          path: filePath,
          _sid: sid
        },
        httpsAgent,
        timeout: 30000
      });

      if (shareResponse.data.success && shareResponse.data.data?.links?.[0]) {
        shareUrl = shareResponse.data.data.links[0].url;
        console.log('✅ Share link created');
      } else {
        console.log('⚠️ Share link creation returned no URL');
      }
    } catch (error) {
      console.log('⚠️ Share link creation failed (file still uploaded)');
    }

    // Step 5: Logout
    try {
      await axios.get(`${NAS_URL}/webapi/auth.cgi`, {
        params: {
          api: 'SYNO.API.Auth',
          version: 6,
          method: 'logout',
          session: 'FileStation',
          _sid: sid
        },
        httpsAgent,
        timeout: 10000
      });
      console.log('✅ Logged out from NAS');
    } catch (error) {
      console.log('⚠️ Logout failed (non-critical)');
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 Total process completed in ${totalTime}s`);

    return NextResponse.json({
      success: true,
      nasPath: filePath,
      shareUrl: shareUrl,
      fileName: file.name,
      fileSize: fileSizeMB + ' MB',
      uploadTime: uploadTime + 's'
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    console.error('Error details:', error);
    
    // Return specific error messages
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { success: false, error: 'Upload timeout - file too large or connection slow' },
        { status: 504 }
      );
    }
    
    if (error.message?.includes('heap out of memory')) {
      return NextResponse.json(
        { success: false, error: 'File too large - server out of memory. Try a smaller file.' },
        { status: 507 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}