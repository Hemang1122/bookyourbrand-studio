import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { encodePayload, generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, userId } = body;

    console.log('=== PhonePe Standard Initiation ===');
    console.log('Order ID:', orderId);
    console.log('Amount:', amount);

    // 1. Construct Standard Payload
    const payload = {
      merchantId: phonePeConfig.MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId || 'USER_' + orderId.split('_')[0],
      amount: Math.round(amount * 100), // Ensure it's an integer in paise
      redirectUrl: phonePeConfig.REDIRECT_URL,
      redirectMode: 'POST',
      callbackUrl: phonePeConfig.CALLBACK_URL,
      mobileNumber: customerPhone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // 2. Encode and Hash
    const base64Payload = encodePayload(payload);
    const endpoint = '/pg/v1/pay';
    const xVerify = generatePhonePeChecksum(base64Payload, endpoint);

    console.log('X-VERIFY generated successfully');

    // 3. Request to Standard API
    const response = await axios.post(
      `${phonePeConfig.API_URL}${endpoint}`,
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'accept': 'application/json'
        }
      }
    );

    console.log('PhonePe Response Success:', response.data.success);

    if (response.data && response.data.success) {
      return NextResponse.json({
        success: true,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        orderId: orderId
      });
    } else {
      throw new Error(response.data?.message || 'PhonePe initiation failed');
    }

  } catch (error: any) {
    console.error('=== PhonePe API Error ===');
    console.error('Message:', error.message);
    console.error('Response Data:', error.response?.data);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Payment service unavailable',
        code: error.response?.data?.code
      },
      { status: 500 }
    );
  }
}
