import { NextResponse } from 'next/server';

export async function GET() {
  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Secret key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://payments.thirdweb.com/v1/developer/payments', {
      method: 'GET',
      headers: {
        'x-secret-key': secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
