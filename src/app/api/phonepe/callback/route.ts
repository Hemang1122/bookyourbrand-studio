import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';
import axios from 'axios';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin for server-side updates
function initAdmin() {
  if (admin.apps.length > 0) return admin.firestore();
  
  try {
    const serviceAccountPath = path.join(process.cwd(), 'service-accounts.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } else {
      if (!admin.apps.length) {
        admin.initializeApp();
      }
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
    console.log('PhonePe Callback Received:', body);

    const { merchantOrderId, state, transactionId } = body;

    if (!merchantOrderId || state !== 'COMPLETED') {
       return NextResponse.json({ success: false, message: 'Payment not completed or invalid payload' });
    }

    // Securely verify transaction status with PhonePe using OAuth Token
    const accessToken = await getPhonePeAccessToken();
    const statusCheck = await axios.get(
      `${phonePeConfig.STATUS_URL}/${phonePeConfig.MERCHANT_ID}/${merchantOrderId}`,
      {
        headers: {
          'Authorization': `O-Bearer ${accessToken}`,
          'X-CLIENT-ID': phonePeConfig.CLIENT_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    const verification = statusCheck.data;
    console.log('Status Verification:', verification);

    if (verification.state === 'COMPLETED' && verification.paymentState === 'COMPLETED') {
      const ordersRef = db.collection('orders');
      const q = await ordersRef.where('orderId', '==', merchantOrderId).limit(1).get();
      
      if (q.empty) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 303);
      }

      const orderDoc = q.docs[0];
      const orderData = orderDoc.data();
      
      if (orderData.status === 'paid') {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 303);
      }

      const clientId = orderData.clientId || orderData.userId;
      const batch = db.batch();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const activePackage = {
        clientId: clientId,
        packageName: orderData.packageDetails?.packageName || 'Standard',
        numberOfReels: orderData.packageDetails?.numberOfReels || 10,
        duration: orderData.packageDetails?.duration || 30,
        price: verification.amount / 100,
        reelsUsed: 0,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        status: 'active',
        paymentId: transactionId || verification.transactionId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const packageRef = db.collection('client-packages').doc();
      batch.set(packageRef, activePackage);

      batch.update(db.collection('clients').doc(clientId), {
        currentPackage: { ...activePackage, id: packageRef.id },
        reelsLimit: activePackage.numberOfReels,
        packageName: activePackage.packageName,
        maxDuration: activePackage.duration,
        reelsCreated: 0
      });

      batch.update(db.collection('users').doc(clientId), {
        packageName: activePackage.packageName,
        reelsLimit: activePackage.numberOfReels
      });

      batch.update(orderDoc.ref, { 
        status: 'paid', 
        packageId: packageRef.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: transactionId || verification.transactionId
      });

      await batch.commit();
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-success?orderId=${merchantOrderId}&txnId=${transactionId}&amount=${verification.amount / 100}`, 303);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-failed?orderId=${merchantOrderId}`, 303);

  } catch (error: any) {
    console.error('Callback Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
