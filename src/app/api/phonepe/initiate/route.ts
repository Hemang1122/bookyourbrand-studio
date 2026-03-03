import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum, encodePayload } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerPhone, customerName } = body;

    // Create payment request payload
    const paymentPayload = {
      merchantId: phonePeConfig.MERCHANT_ID,
      transactionId: orderId,
      merchantOrderId: orderId,
      amount: amount * 100, // Convert to paise
      mobileNumber: customerPhone,
      message: `Payment for package - Order ${orderId}`,
      expiresIn: 3600, // 1 hour expiry
      shortName: customerName || 'Customer',
    };

    // Encode the payload to base64
    const base64Payload = encodePayload(paymentPayload);
    
    // Generate checksum
    const endpoint = '/v3/payLink/init';
    const checksum = generatePhonePeChecksum(base64Payload, endpoint);

    console.log('Initiating PhonePe payment:', {
      merchantId: phonePeConfig.MERCHANT_ID,
      transactionId: orderId,
      amount: amount
    });

    // Make API call to PhonePe
    const response = await axios.post(
      `${phonePeConfig.API_URL}/payLink/init`,
      {
        request: base64Payload
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-CALLBACK-URL': phonePeConfig.CALLBACK_URL
        }
      }
    );

    console.log('PhonePe response:', response.data);

    if (response.data.success) {
      return NextResponse.json({
        success: true,
        data: response.data.data,
        paymentUrl: response.data.data.payLink,
        transactionId: response.data.data.transactionId
      });
    } else {
      throw new Error(response.data.message || 'Payment initiation failed');
    }

  } catch (error: any) {
    console.error('PhonePe initiate error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to initiate payment' 
      },
      { status: 500 }
    );
  }
}
