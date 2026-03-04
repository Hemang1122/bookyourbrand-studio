import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, userId, customerName, packageDetails } = body;

    console.log('Mock payment initiated:', { orderId, amount, userId });

    // Generate mock payment URL with all necessary details passed as params for the mock success page to use
    const mockPaymentUrl = `/mock-payment?orderId=${orderId}&amount=${amount}&userId=${userId}&name=${encodeURIComponent(customerName)}&packageName=${encodeURIComponent(packageDetails.packageName)}&reels=${packageDetails.numberOfReels}&duration=${packageDetails.duration}`;

    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      orderId: orderId
    });

  } catch (error: any) {
    console.error('Mock payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
