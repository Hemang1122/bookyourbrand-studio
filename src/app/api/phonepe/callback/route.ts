import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generateChecksum } from '@/lib/phonepe-helper';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

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
    
    // PhonePe sends callback as application/x-www-form-urlencoded with 'response' field
    const formData = await request.formData();
    const responseBase64 = formData.get('response') as string;

    if (!responseBase64) {
      console.log('No response field found in callback');
      return NextResponse.json({ success: false, message: 'No response data' });
    }

    // Decode response
    const decodedResponse = JSON.parse(Buffer.from(responseBase64, 'base64').toString('utf-8'));
    console.log('PhonePe Callback Received:', decodedResponse);

    const { success, code, data } = decodedResponse;
    const merchantTransactionId = data?.merchantTransactionId;

    if (!success || code !== 'PAYMENT_SUCCESS' || !merchantTransactionId) {
       console.log('Transaction not successful:', code);
       return NextResponse.json({ success: false, message: 'Payment not successful' });
    }

    // 1. Securely verify transaction status with PhonePe (Status API)
    const endpoint = `/pg/v1/status/${phonePeConfig.MERCHANT_ID}/${merchantTransactionId}`;
    const checksum = generateChecksum('', endpoint);
    
    const statusCheckResponse = await axios.get(
      `${phonePeConfig.API_URL}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': phonePeConfig.MERCHANT_ID
        }
      }
    );

    const verification = statusCheckResponse.data;
    console.log('Status Verification Result:', verification);

    if (verification.success && verification.code === 'PAYMENT_SUCCESS') {
      // 2. Find the order in Firestore
      const ordersRef = db.collection('orders');
      const q = await ordersRef.where('orderId', '==', merchantTransactionId).limit(1).get();
      
      if (q.empty) {
        console.error('Order not found for verification:', merchantTransactionId);
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
        price: orderData.amount,
        reelsUsed: 0,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        status: 'active',
        paymentId: data.transactionId,
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
        transactionId: data.transactionId
      });

      await batch.commit();
      console.log('Package activated successfully via callback for order:', merchantTransactionId);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Verification failed' });

  } catch (error: any) {
    console.error('Callback Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
