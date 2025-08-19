import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, intent } = body;

    const response = await fetch('https://payments.thirdweb.com/v1/developer/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY!,
      },
      body: JSON.stringify({
        title,
        description,
        intent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Payment link creation failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}