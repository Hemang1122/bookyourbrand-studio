import { NextRequest, NextResponse } from 'next/server';
import { resolveQuickConnect, nasLogin, nasUploadFile, nasLogout } from '@/lib/synology';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json({ success: false, error: 'File and Project ID are required' }, { status: 400 });
    }

    console.log(`🚀 Starting NAS upload for file: ${file.name} (Project: ${projectId})`);

    // 1. Resolve NAS URL
    const nasUrl = await resolveQuickConnect();
    if (!nasUrl) {
      return NextResponse.json({ success: false, error: 'Could not resolve NAS address' }, { status: 503 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let sid: string | null = null;

    try {
      // 2. Authenticate
      sid = await nasLogin(nasUrl);

      if (!sid) {
        return NextResponse.json({ success: false, error: 'NAS authentication failed' }, { status: 503 });
      }

      // 3. Define path (must start with a shared folder name)
      const folderPath = `/CRM-Uploads/projects/${projectId}`;

      // 4. Execute Upload
      const uploadResult = await nasUploadFile(nasUrl, sid, folderPath, file.name, buffer);

      if (uploadResult.success) {
        console.log(`✅ Successfully uploaded ${file.name} to NAS`);
        return NextResponse.json({
          success: true,
          fileName: file.name,
          path: `${folderPath}/${file.name}`
        });
      } else {
        console.error('❌ NAS Upload Response Error:', uploadResult.error);
        return NextResponse.json({
          success: false,
          error: `NAS Error Code: ${uploadResult.error?.code || 'Unknown'}`
        }, { status: 500 });
      }
    } finally {
      // 5. Always logout
      if (sid && nasUrl) {
        await nasLogout(nasUrl, sid);
      }
    }

  } catch (error: any) {
    console.error('❌ NAS Upload API Route Exception:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}