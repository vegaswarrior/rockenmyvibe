import 'server-only';

const PRINTFUL_BASE_URL = 'https://api.printful.com';

function getPrintfulHeaders() {
  const apiKey = process.env.PRINTFUL_SECRET_KEY;
  if (!apiKey) {
    throw new Error('PRINTFUL_SECRET_KEY is not set in environment variables');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  } as const;
}

// Fetch list of products from Printful Sync API
export async function fetchPrintfulStoreProducts() {
  const res = await fetch(`${PRINTFUL_BASE_URL}/sync/products`, {
    method: 'GET',
    headers: getPrintfulHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Printful products: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { result?: unknown[] };
  return data.result ?? [];
}

// Fetch detailed product (including variants) from Printful Sync API
export async function fetchPrintfulStoreProduct(id: number | string) {
  const res = await fetch(`${PRINTFUL_BASE_URL}/sync/products/${id}`, {
    method: 'GET',
    headers: getPrintfulHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Printful product ${id}: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as { result?: unknown };
  return data.result;
}
