import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    console.log('=== PhonePe v2 Payment Initiation ===');
    console.log('Order ID:', orderId);
    
    // 1. Obtain OAuth Access Token using the new server-side helper
    const accessToken = await getPhonePeAccessToken();

    // 2. Construct v2 Checkout Payload
    const paymentPayload = {
      merchantOrderId: orderId,
      amount: Math.round(amount * 100), // Convert to paise (must be integer)
      expireAfter: 3600, // 1 hour
      metaInfo: {
        udf1: customerName || 'Client',
        udf2: customerPhone || '9999999999',
        udf3: 'Package Purchase'
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: {
          redirectUrl: phonePeConfig.REDIRECT_URL,
          callbackUrl: phonePeConfig.CALLBACK_URL
        }
      }
    };

    // 3. Initiate Checkout with O-Bearer token
    const response = await axios.post(
      phonePeConfig.PAY_URL,
      paymentPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`,
          'X-CLIENT-ID': phonePeConfig.CLIENT_ID
        }
      }
    );

    console.log('PhonePe v2 Pay Response:', response.data);

    if (response.data && response.data.redirectUrl) {
      return NextResponse.json({
        success: true,
        paymentUrl: response.data.redirectUrl,
        orderId: orderId
      });
    } else {
      throw new Error(response.data?.message || 'Invalid response from PhonePe Checkout');
    }

  } catch (error: any) {
    console.error('=== PhonePe Initiation Failure ===');
    const errorData = error.response?.data || { message: error.message };
    console.error('Details:', JSON.stringify(errorData, null, 2));
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorData.message || 'Payment initiation failed',
        code: errorData.code
      },
      { status: 500 }
    );
  }
}
