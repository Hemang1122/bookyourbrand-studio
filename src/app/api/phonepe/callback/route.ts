import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), 'service-accounts.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PhonePe callback received:', body);

    const { transactionId, merchantId } = body;

    if (!transactionId || !merchantId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check transaction status with PhonePe for security (Server-to-Server verification)
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

    console.log('Status check response:', statusResponse.data);

    if (statusResponse.data.success && statusResponse.data.code === 'PAYMENT_SUCCESS') {
      const { transactionId: orderId, amount } = statusResponse.data.data;
      
      // 1. Fetch the pending order details from Firestore
      const orderRef = db.collection('pending-orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        console.error('Order not found in Firestore:', orderId);
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      const orderData = orderDoc.data();
      if (!orderData) return NextResponse.json({ success: false }, { status: 500 });

      // 2. Update Client and User documents to activate the package
      const clientId = orderData.clientId;
      const clientRef = db.collection('clients').doc(clientId);
      const userRef = db.collection('users').doc(clientId);

      const batch = db.batch();
      
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create new package entry for client record
      const activePackage = {
        ...orderData,
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        paymentId: transactionId,
        paymentAmount: amount / 100 // Convert from paise
      };

      batch.update(clientRef, {
        currentPackage: activePackage,
        reelsLimit: orderData.numberOfReels,
        packageName: orderData.packageName,
        reelsCreated: 0 // Reset usage counter on new package activation
      });

      batch.update(userRef, {
        packageName: orderData.packageName,
        reelsLimit: orderData.numberOfReels
      });

      // Mark order as paid in history
      batch.update(orderRef, { status: 'paid', paidAt: admin.firestore.FieldValue.serverTimestamp() });

      await batch.commit();

      console.log(`Payment verified and package activated for client: ${clientId}`);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and package activated'
      });
    } else {
      console.log('Payment failed or pending verification:', statusResponse.data);
      return NextResponse.json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error: any) {
    console.error('PhonePe callback error:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
