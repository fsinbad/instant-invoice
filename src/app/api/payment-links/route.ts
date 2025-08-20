import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const receiver = searchParams.get('receiver');

  if (!receiver) {
    return NextResponse.json({ error: 'Receiver address is required' }, { status: 400 });
  }

  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Secret key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://payments.thirdweb.com/v1/developer/links', {
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
    console.log(data);

    // Filter links by receiver address
    const filteredLinks = data.data?.filter((link: { receiver?: string }) =>
      link.receiver?.toLowerCase() === receiver.toLowerCase()
    ) || [];

    return NextResponse.json({ data: filteredLinks });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json({ error: 'Failed to fetch payment links' }, { status: 500 });
  }
}
