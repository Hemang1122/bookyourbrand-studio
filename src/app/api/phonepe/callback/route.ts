import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin safely
function initAdmin() {
  if (admin.apps.length > 0) return admin.firestore();
  
  try {
    const serviceAccountPath = path.join(process.cwd(), 'service-accounts.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error('Admin Init Error:', err);
  }
  return admin.firestore();
}

export async function POST(request: NextRequest) {
  try {
    const db = initAdmin();
    const body = await request.json();
    console.log('PhonePe v2 Callback Received:', body);

    const { merchantOrderId, state, transactionId } = body;

    if (!merchantOrderId || state !== 'COMPLETED') {
       console.log('Transaction not completed or invalid payload');
       return NextResponse.json({ success: false, message: 'Payment not completed' });
    }

    // 1. Securely verify transaction status with PhonePe
    const accessToken = await getPhonePeAccessToken();
    const statusUrl = `${phonePeConfig.STATUS_URL}/${merchantOrderId}/status`;
    
    const statusCheckResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `O-Bearer ${accessToken}`,
        'X-CLIENT-ID': phonePeConfig.CLIENT_ID,
        'Content-Type': 'application/json'
      }
    });

    if (!statusCheckResponse.ok) {
      const errorText = await statusCheckResponse.text();
      console.error('Status verification failed:', errorText);
      return NextResponse.json({ success: false, message: 'Status verification failed' });
    }

    const verification = await statusCheckResponse.json();
    console.log('Status Verification Result:', verification);

    if (verification.state === 'COMPLETED' && (verification.paymentState === 'COMPLETED' || verification.paymentState === 'SUCCESS')) {
      // 2. Find the order in Firestore
      const ordersRef = db.collection('orders');
      const q = await ordersRef.where('orderId', '==', merchantOrderId).limit(1).get();
      
      if (q.empty) {
        console.error('Order not found for verification:', merchantOrderId);
        return NextResponse.json({ success: false, message: 'Order not found' });
      }

      const orderDoc = q.docs[0];
      const orderData = orderDoc.data();
      
      if (orderData.status === 'paid') {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      const clientId = orderData.clientId || orderData.userId;
      const batch = db.batch();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // 3. Create Package and Update Limits
      const activePackage = {
        clientId: clientId,
        packageName: orderData.packageDetails?.packageName || 'Standard',
        numberOfReels: orderData.packageDetails?.numberOfReels || 10,
        duration: orderData.packageDetails?.duration || 30,
        price: (verification.amount || (orderData.amount * 100)) / 100,
        reelsUsed: 0,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        status: 'active',
        paymentId: transactionId || verification.transactionId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const packageRef = db.collection('client-packages').doc();
      batch.set(packageRef, activePackage);

      // Update client record
      batch.update(db.collection('clients').doc(clientId), {
        currentPackage: { ...activePackage, id: packageRef.id },
        reelsLimit: activePackage.numberOfReels,
        packageName: activePackage.packageName,
        maxDuration: activePackage.duration,
        reelsCreated: 0
      });

      // Update user record
      batch.update(db.collection('users').doc(clientId), {
        packageName: activePackage.packageName,
        reelsLimit: activePackage.numberOfReels
      });

      // Update order record
      batch.update(orderDoc.ref, { 
        status: 'paid', 
        packageId: packageRef.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: transactionId || verification.transactionId
      });

      await batch.commit();
      console.log('Package activated successfully via callback for order:', merchantOrderId);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Verification failed' });

  } catch (error: any) {
    console.error('v2 Callback Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
