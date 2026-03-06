import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToNAS } from '@/lib/nas-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileData, clientName } = body;
    
    if (!fileName || !fileData || !clientName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: fileName, fileData (base64), or clientName' 
      }, { status: 400 });
    }

    console.log(`🚀 Bridge: Starting NAS upload for ${fileName} (${clientName})`);

    // Convert Base64 string back to Buffer for the service
    const buffer = Buffer.from(fileData, 'base64');
    
    // Use the verified NAS service to perform the upload
    const result = await uploadFileToNAS(buffer, fileName, clientName);

    if (result.success) {
      console.log(`✅ Bridge: Successfully uploaded ${fileName} to NAS path: ${result.path}`);
      return NextResponse.json({ 
        success: true, 
        nasPath: result.path 
      });
    } else {
      console.error('❌ Bridge: NAS Service reported error:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Bridge: Critical Exception:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
