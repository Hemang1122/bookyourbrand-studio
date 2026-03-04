import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { encodePayload, generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName, userId } = body;

    // 1. Construct Request Payload
    const payload = {
      merchantId: phonePeConfig.MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to paise
      redirectUrl: phonePeConfig.REDIRECT_URL,
      redirectMode: 'POST',
      callbackUrl: phonePeConfig.CALLBACK_URL,
      mobileNumber: customerPhone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // 2. Encode and Generate Checksum
    const base64Payload = encodePayload(payload);
    const endpoint = '/pg/v1/pay';
    const xVerify = generatePhonePeChecksum(base64Payload, endpoint);

    // 3. Initiate Request to PhonePe
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
    console.error('PhonePe Error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Payment service unavailable' 
      },
      { status: 500 }
    );
  }
}
