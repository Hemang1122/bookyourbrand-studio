import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum } from '@/lib/phonepe-helper';
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
    
    // 1. PhonePe sends POST with B64 encoded payload in 'response' field
    const formData = await request.formData();
    const base64Response = formData.get('response') as string;

    if (!base64Response) {
      return NextResponse.json({ success: false, error: 'No response data' }, { status: 400 });
    }

    // 2. Decode the response
    const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
    console.log('Decoded Callback Payload:', decodedResponse);

    const { success, code, data } = decodedResponse;
    const transactionId = data?.merchantTransactionId;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Invalid transaction data' }, { status: 400 });
    }

    // 3. Verify status with server-to-server check (Crucial for security)
    const statusEndpoint = `/pg/v1/status/${phonePeConfig.MERCHANT_ID}/${transactionId}`;
    const xVerify = generatePhonePeChecksum('', statusEndpoint);

    const statusCheck = await axios.get(
      `${phonePeConfig.API_URL}${statusEndpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': phonePeConfig.MERCHANT_ID,
          'accept': 'application/json'
        }
      }
    );

    const verification = statusCheck.data;
    console.log('S2S Verification Result:', verification);

    if (verification.success && verification.code === 'PAYMENT_SUCCESS') {
      // Find the corresponding order in Firestore
      const ordersRef = db.collection('orders');
      const q = await ordersRef.where('orderId', '==', transactionId).limit(1).get();
      
      if (q.empty) {
        console.error(`Order ${transactionId} not found in database`);
        // We still redirect to success because payment is done, but log the error
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-success?orderId=${transactionId}&txnId=${verification.data.transactionId}&amount=${verification.data.amount / 100}`, 303);
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
        price: verification.data.amount / 100,
        reelsUsed: 0,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        status: 'active',
        paymentId: verification.data.transactionId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Provision account
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
        transactionId: verification.data.transactionId
      });

      await batch.commit();
      
      // Final Redirect to client UI
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-success?orderId=${transactionId}&txnId=${verification.data.transactionId}&amount=${verification.data.amount / 100}`, 303);
    }

    // Payment Failed
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-failed?reason=${verification.code}&orderId=${transactionId}`, 303);

  } catch (error: any) {
    console.error('Callback Logic Error:', error.message);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment-failed?reason=callback_error`, 303);
  }
}
