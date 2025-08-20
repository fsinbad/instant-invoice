import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Secret key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://payments.thirdweb.com/v1/developer/links/${id}`, {
      method: 'GET',
      headers: {
        'x-secret-key': secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payment link:', error);
    return NextResponse.json({ error: 'Failed to fetch payment link' }, { status: 500 });
  }
}