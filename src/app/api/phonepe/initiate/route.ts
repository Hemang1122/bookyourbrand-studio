import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generateChecksum, encodePayload } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    console.log('=== PhonePe Payment Initiation ===');
    console.log('Order ID:', orderId);
    console.log('Amount:', amount, 'INR');

    // Create payment payload for v1 Standard PG
    const paymentPayload = {
      merchantId: phonePeConfig.MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: `USER_${Date.now()}`,
      amount: Math.round(amount * 100), // Convert to paise (must be integer)
      redirectUrl: phonePeConfig.REDIRECT_URL,
      redirectMode: 'POST',
      callbackUrl: phonePeConfig.CALLBACK_URL,
      mobileNumber: customerPhone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Encode payload to base64
    const base64Payload = encodePayload(paymentPayload);
    
    // Generate checksum
    const endpoint = '/pg/v1/pay';
    const checksum = generateChecksum(base64Payload, endpoint);

    // Make API call to PhonePe
    const response = await axios.post(
      `${phonePeConfig.API_URL}/pg/v1/pay`,
      {
        request: base64Payload
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum
        }
      }
    );

    console.log('PhonePe Response:', response.data);

    if (response.data && response.data.success && response.data.data) {
      const paymentUrl = response.data.data.instrumentResponse?.redirectInfo?.url;
      
      if (!paymentUrl) {
        throw new Error('No payment URL in response');
      }

      return NextResponse.json({
        success: true,
        paymentUrl: paymentUrl,
        orderId: orderId
      });
    } else {
      throw new Error(response.data?.message || 'Invalid response from PhonePe');
    }

  } catch (error: any) {
    console.error('=== PhonePe Initiation Error ===');
    const errorData = error.response?.data || error.message;
    console.error('Details:', errorData);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `PhonePe initiation failed: ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`
      },
      { status: 500 }
    );
  }
}
