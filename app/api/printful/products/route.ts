import { NextResponse } from 'next/server';
import { fetchPrintfulStoreProducts } from '@/lib/printful';

export async function GET() {
  try {
    const products = await fetchPrintfulStoreProducts();

    // Basic server-side logging so we can see what Printful returned
    console.log('[Printful] /store/products result count:', products?.length ?? 0);

    return NextResponse.json({
      success: true,
      count: products?.length ?? 0,
      products,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Printful] Error fetching products:', error);

    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to fetch Printful products',
      },
      { status: 500 },
    );
  }
}
