import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generatePhonePeChecksum } from '@/lib/phonepe-helper';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    const merchantId = phonePeConfig.MERCHANT_ID;
    // Standard PhonePe v1 Status API endpoint
    const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
    
    // We use an empty payload for status checks as per PhonePe documentation
    const checksum = generatePhonePeChecksum('', endpoint);

    const response = await axios.get(
      `${phonePeConfig.API_URL}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': merchantId
        }
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Status check error:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
