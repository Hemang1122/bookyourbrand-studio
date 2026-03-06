import { NextRequest, NextResponse } from 'next/server';
import { nasLogin, nasUploadFile, nasLogout } from '@/lib/synology';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json({ success: false, error: 'File and Project ID are required' }, { status: 400 });
    }

    console.log(`🚀 Starting NAS upload for file: ${file.name} (Project: ${projectId})`);

    const buffer = Buffer.from(await file.arrayBuffer());
    let sid: string | null = null;

    try {
      sid = await nasLogin();
      
      // Organize files by project ID on the NAS in the CRM-Uploads shared folder
      const folderPath = `/CRM-Uploads/projects/${projectId}`;
      
      const uploadResult = await nasUploadFile(sid, folderPath, file.name, buffer);
      
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
      if (sid) {
        await nasLogout(sid);
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
