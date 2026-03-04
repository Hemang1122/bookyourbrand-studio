import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    console.log('=== PhonePe Payment Initiation ===');
    console.log('Order ID:', orderId);
    console.log('Amount:', amount, 'INR');

    // Step 1: Get OAuth access token
    const accessToken = await getPhonePeAccessToken();

    // Step 2: Create payment request payload
    const paymentPayload = {
      merchantOrderId: orderId,
      amount: amount * 100, // Convert to paise
      expireAfter: 3600, // 1 hour in seconds
      metaInfo: {
        udf1: customerName || 'Customer',
        udf2: customerPhone || '9999999999',
        udf3: 'Package Purchase'
      }
    };

    console.log('Payment payload:', paymentPayload);

    // Step 3: Make API call to PhonePe Checkout
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

    console.log('PhonePe API Response:', response.data);

    if (response.data && response.data.orderId) {
      // Construct payment URL
      const baseUrl = phonePeConfig.API_URL.replace('/apis/pg-sandbox', '');
      const paymentUrl = response.data.redirectUrl?.startsWith('http') 
        ? response.data.redirectUrl 
        : `${baseUrl}${response.data.redirectUrl}`;

      return NextResponse.json({
        success: true,
        data: response.data,
        paymentUrl: paymentUrl,
        orderId: response.data.orderId
      });
    } else {
      throw new Error('Invalid response from PhonePe');
    }

  } catch (error: any) {
    console.error('=== PhonePe Payment Error ===');
    console.error('Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to initiate payment',
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
