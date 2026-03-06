import { NextRequest, NextResponse } from 'next/server';
import { phonePeConfig } from '@/lib/phonepe-config';
import { generateChecksum } from '@/lib/phonepe-helper';
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
    const endpoint = `/v3/transaction/${merchantId}/status/${transactionId}`;
    const checksum = generateChecksum('', endpoint);

    const response = await axios.get(
      `${phonePeConfig.API_URL}/transaction/${merchantId}/status/${transactionId}`,
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
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
