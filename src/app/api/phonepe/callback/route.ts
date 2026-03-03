import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PhonePe callback received:', body);

    // Note: PhonePe often sends a base64 encoded 'response'. 
    // If your webhook is receiving the encoded response, you might need:
    // const decodedResponse = decodePayload(body.response);
    // const { transactionId, merchantId } = decodedResponse.data;
    
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
      const { transactionId: verifiedId, amount } = statusResponse.data.data;
      const amountInRupees = amount / 100;

      /**
       * TODO: Update your database here
       * 1. Mark the associated client-package as 'active'
       * 2. Log the payment transaction
       * 3. Send a confirmation notification/email
       */

      console.log(`Payment verified successfully - Order: ${verifiedId}, Amount: ₹${amountInRupees}`);

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully'
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
