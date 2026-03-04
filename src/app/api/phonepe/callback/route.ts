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
    } else {
      // Fallback for production/environment based init
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
    
    // PhonePe might send data in body or as query params depending on the flow
    let transactionId: string | null = null;
    
    try {
      const body = await request.json();
      transactionId = body.transactionId || body.merchantOrderId;
    } catch (e) {
      // If JSON parsing fails, try query params (Standard for some redirect flows)
      const searchParams = request.nextUrl.searchParams;
      transactionId = searchParams.get('transactionId') || searchParams.get('merchantOrderId');
    }

    if (!transactionId) {
      console.error('Callback Error: No transaction ID found in request');
      return NextResponse.json({ success: false, error: 'No transaction ID' }, { status: 400 });
    }

    console.log(`Processing callback for transaction: ${transactionId}`);

    // 1. Verify Payment Status with PhonePe directly (Server-to-Server)
    const accessToken = await getPhonePeAccessToken();
    const statusResponse = await axios.get(
      `${phonePeConfig.API_URL}/checkout/v2/status/${transactionId}`,
      {
        headers: {
          'Authorization': `O-Bearer ${accessToken}`,
          'X-CLIENT-ID': phonePeConfig.CLIENT_ID
        }
      }
    );

    const result = statusResponse.data;
    console.log('PhonePe Verification Result:', result);

    // 2. If Payment is Successful, Activate Package
    if (result.success && (result.state === 'COMPLETED' || result.code === 'PAYMENT_SUCCESS')) {
      // Find the corresponding pending order
      const orderRef = db.collection('pending-orders').doc(transactionId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        console.error(`Order ${transactionId} not found in database`);
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      const orderData = orderDoc.data()!;
      
      // If already processed, don't duplicate
      if (orderData.status === 'paid') {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      const clientId = orderData.clientId;
      const batch = db.batch();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

      const activePackage = {
        clientId: orderData.clientId,
        packageName: orderData.packageName,
        numberOfReels: orderData.numberOfReels,
        duration: orderData.duration,
        price: orderData.price,
        reelsUsed: 0,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        status: 'active',
        paymentId: transactionId,
        paymentAmount: (result.amount || result.data?.amount || 0) / 100,
        includeAIVoice: orderData.includeAIVoice || false,
        includeStockFootage: orderData.includeStockFootage || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // 1. Add to client-packages history collection
      const packageRef = db.collection('client-packages').doc();
      batch.set(packageRef, activePackage);

      // 2. Update Client Profile with current package snapshot
      batch.update(db.collection('clients').doc(clientId), {
        currentPackage: { ...activePackage, id: packageRef.id },
        reelsLimit: orderData.numberOfReels,
        packageName: orderData.packageName,
        maxDuration: orderData.duration,
        reelsCreated: 0 // Reset usage counter for new package
      });

      // 3. Sync primary User document for UI dashboard
      batch.update(db.collection('users').doc(clientId), {
        packageName: orderData.packageName,
        reelsLimit: orderData.numberOfReels
      });

      // 4. Mark pending order as completed
      batch.update(orderRef, { 
        status: 'paid', 
        packageId: packageRef.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      // 5. Create a system notification for the client
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        message: `Your ${orderData.packageName} package has been activated! You can now start creating up to ${orderData.numberOfReels} reels.`,
        url: '/dashboard',
        recipients: [clientId],
        readBy: [],
        type: 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      console.log(`Successfully activated package for client ${clientId}`);

      return NextResponse.json({ success: true, message: 'Package activated' });
    }

    console.warn(`Payment failed or pending for ${transactionId}:`, result.state);
    return NextResponse.json({ success: false, message: 'Payment not completed' });

  } catch (error: any) {
    console.error('Callback Critical Error:', error.response?.data || error.message);
    return NextResponse.json({ success: false, error: 'Internal server error processing callback' }, { status: 500 });
  }
}
