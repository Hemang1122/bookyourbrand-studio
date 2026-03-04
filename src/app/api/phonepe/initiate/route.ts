import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    // 1. Get Access Token
    const accessToken = await getPhonePeAccessToken();

    // 2. Prepare Checkout Payload
    const paymentPayload = {
      merchantOrderId: orderId,
      amount: amount * 100, // Convert to paise
      expireAfter: 3600, // 1 hour
      metaInfo: {
        udf1: customerName || 'Customer',
        udf2: customerPhone || '9999999999',
        udf3: 'Agency Package Purchase'
      }
    };

    // 3. Initiate Checkout
    const response = await axios.post(
      `${phonePeConfig.API_URL}/checkout/v2/pay`,
      paymentPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`,
          'X-CLIENT-ID': phonePeConfig.CLIENT_ID
        }
      }
    );

    if (response.data && response.data.redirectUrl) {
      // The redirectUrl might be relative in sandbox, normalize it
      let paymentUrl = response.data.redirectUrl;
      if (!paymentUrl.startsWith('http')) {
        const baseUrl = phonePeConfig.API_URL.replace('/apis/pg-sandbox', '');
        paymentUrl = `${baseUrl}${paymentUrl}`;
      }

      return NextResponse.json({
        success: true,
        paymentUrl: paymentUrl,
        orderId: response.data.orderId
      });
    } else {
      throw new Error('Invalid response from PhonePe gateway');
    }

  } catch (error: any) {
    console.error('PhonePe Initiation Error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Payment service unavailable' 
      },
      { status: 500 }
    );
  }
}
