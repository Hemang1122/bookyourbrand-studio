import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, userId, customerName, packageDetails } = body;

    console.log('Payment session initiated:', { orderId, amount, userId });

    // Generate portal URL with all necessary details
    // Using BYB prefix for brand identification
    const mockPaymentUrl = `/mock-payment?orderId=${orderId}&amount=${amount}&userId=${userId}&name=${encodeURIComponent(customerName)}`;

    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      orderId: orderId
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
