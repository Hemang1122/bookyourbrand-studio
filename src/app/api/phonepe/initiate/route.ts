import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { getPhonePeAccessToken } from '@/lib/phonepe-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    console.log('=== PhonePe v2 Payment Initiation ===');
    console.log('Order ID:', orderId);
    
    // 1. Obtain OAuth Access Token
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
    const response = await fetch(phonePeConfig.PAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
        'X-CLIENT-ID': phonePeConfig.CLIENT_ID
      },
      body: JSON.stringify(paymentPayload)
    });

    const responseText = await response.text();
    console.log('PhonePe v2 Pay Response Status:', response.status);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        if (data.redirectUrl) {
          return NextResponse.json({
            success: true,
            paymentUrl: data.redirectUrl,
            orderId: orderId
          });
        } else {
          console.error('PhonePe missing redirectUrl in response:', data);
          return NextResponse.json({ success: false, error: 'Invalid PhonePe response', details: data }, { status: 500 });
        }
      } catch (e) {
        console.error('Failed to parse PhonePe pay response:', responseText);
        return NextResponse.json({ success: false, error: 'Non-JSON response from PhonePe', details: responseText }, { status: 500 });
      }
    } else {
      console.error('PhonePe Initiation Error:', responseText);
      return NextResponse.json({
        success: false,
        error: 'PhonePe initiation failed',
        details: responseText
      }, { status: response.status });
    }

  } catch (error: any) {
    console.error('=== PhonePe Initiation Exception ===');
    console.error('Error:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error during initiation'
      },
      { status: 500 }
    );
  }
}
