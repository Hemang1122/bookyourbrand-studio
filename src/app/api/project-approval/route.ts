import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
// This check prevents re-initializing the app in a serverless environment.
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const action = searchParams.get('action'); 
  const token = searchParams.get('token');
  
  if (!projectId || !action || !token) {
    return NextResponse.redirect(new URL('/approval-error?reason=missing_params', request.url));
  }
  
  const db = getFirestore();
  
  try {
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return NextResponse.redirect(new URL('/approval-error?reason=not_found', request.url));
    }
    
    const projectData = projectDoc.data()!;
    
    if (projectData.approvalToken !== token) {
      return NextResponse.redirect(new URL('/approval-error?reason=invalid_token', request.url));
    }
    
    if (action === 'approve') {
      await projectRef.update({
        status: 'Approved',
        approvedAt: Timestamp.now(),
        approvalToken: null, // Invalidate the token
      });
      
      const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
      const adminIds = usersSnapshot.docs.map(d => d.id);
      
      if (adminIds.length > 0) {
        await db.collection('notifications').add({
          message: `"${projectData.name}" was approved by the client! 🎉`,
          url: `/projects/${projectId}`,
          recipients: adminIds,
          readBy: [],
          timestamp: Timestamp.now(),
          type: 'system',
        });
      }
      
      return NextResponse.redirect(new URL(`/approval-success?project=${encodeURIComponent(projectData.name)}&action=approved`, request.url));
    }
    
    if (action === 'changes') {
      return NextResponse.redirect(new URL(`/approval-feedback?projectId=${projectId}&token=${token}&project=${encodeURIComponent(projectData.name)}`, request.url));
    }
    
    return NextResponse.redirect(new URL('/approval-error?reason=invalid_action', request.url));

  } catch (error) {
    console.error("Project approval error:", error);
    return NextResponse.redirect(new URL('/approval-error?reason=server_error', request.url));
  }
}
