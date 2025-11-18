import { NextResponse } from 'next/server';
import { getAllSizes } from '@/lib/actions/product.actions';

export async function GET() {
  try {
    const sizes = await getAllSizes();
    return NextResponse.json(sizes);
  } catch (err) {
    // log error for debugging
    // eslint-disable-next-line no-console
    console.error('Error fetching sizes:', err);
    return NextResponse.json({ error: 'Unable to fetch sizes' }, { status: 500 });
  }
}