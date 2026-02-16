import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
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

export async function POST(request: NextRequest) {
  try {
    const { projectId, token, feedback } = await request.json();
    
    if (!projectId || !token || !feedback) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const db = getFirestore();
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists || projectDoc.data()?.approvalToken !== token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
    }
    
    const projectData = projectDoc.data()!;
    
    await projectRef.update({
      status: 'Rework',
      clientFeedback: feedback,
      feedbackAt: Timestamp.now(),
      approvalToken: null, // Invalidate token after use
    });
    
    // Notify admin
    const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    const adminIds = usersSnapshot.docs.map(d => d.id);
    
    if (adminIds.length > 0) {
      await db.collection('notifications').add({
        message: `"${projectData.name}" needs rework. Client feedback has been submitted.`,
        url: `/projects/${projectId}`,
        recipients: adminIds,
        readBy: [],
        timestamp: Timestamp.now(),
        type: 'system',
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project feedback error:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
