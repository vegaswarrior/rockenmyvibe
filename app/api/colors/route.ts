import { NextResponse } from 'next/server';
import { getAllColors } from '@/lib/actions/product.actions';

export async function GET() {
  try {
    const colors = await getAllColors();
    return NextResponse.json(colors);
  } catch (err) {
    // log error for debugging
    // eslint-disable-next-line no-console
    console.error('Error fetching colors:', err);
    return NextResponse.json({ error: 'Unable to fetch colors' }, { status: 500 });
  }
}