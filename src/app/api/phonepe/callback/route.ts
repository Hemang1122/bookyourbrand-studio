import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin singleton
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
      console.warn('service-accounts.json not found. Admin SDK not initialized.');
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
  return admin.firestore();
}

export async function POST(request: NextRequest) {
  try {
    const db = initAdmin();
    const body = await request.json();
    console.log('PhonePe callback received:', body);

    const { transactionId, merchantId } = body;

    if (!transactionId || !merchantId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check transaction status with PhonePe for security
    const statusEndpoint = `/v3/transaction/${merchantId}/status/${transactionId}`;
    const checksum = generatePhonePeChecksum('', statusEndpoint);

    const statusResponse = await axios.get(
      `${phonePeConfig.API_URL}/transaction/${merchantId}/status/${transactionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': merchantId
        }
      }
    );

    const responseData = statusResponse.data;

    if (responseData.success && responseData.code === 'PAYMENT_SUCCESS' && responseData.data) {
      const { transactionId: orderId, amount } = responseData.data;
      
      // Fetch the pending order details
      const orderRef = db.collection('pending-orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        return NextResponse.json({ success: false, error: 'Order record not found' }, { status: 404 });
      }

      const orderData = orderDoc.data();
      if (!orderData) throw new Error('Order data is empty');

      // Update Client and User documents
      const clientId = orderData.clientId;
      const clientRef = db.collection('clients').doc(clientId);
      const userRef = db.collection('users').doc(clientId);

      const batch = db.batch();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const activePackage = {
        ...orderData,
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        paymentId: transactionId,
        paymentAmount: amount / 100
      };

      batch.update(clientRef, {
        currentPackage: activePackage,
        reelsLimit: orderData.numberOfReels,
        packageName: orderData.packageName,
        reelsCreated: 0
      });

      batch.update(userRef, {
        packageName: orderData.packageName,
        reelsLimit: orderData.numberOfReels
      });

      batch.update(orderRef, { 
        status: 'paid', 
        paidAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      await batch.commit();

      return NextResponse.json({ success: true, message: 'Package activated' });
    } else {
      return NextResponse.json({ success: false, message: 'Payment verification failed' });
    }

  } catch (error: any) {
    console.error('PhonePe callback processing error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal processing failed' },
      { status: 500 }
    );
  }
}
