'use client';
import React, { useMemo, useState } from 'react';
import { Decimal } from '@prisma/client/runtime/library';
import AddToCart from './add-to-cart';
import { Cart, CartItem } from '@/types';
import ProductPrice from '@/components/shared/product/product-price';

type Variant = {
  id: string;
  sku?: string | null;
  price: string | number | Decimal;
  stock: number;
  images?: string[];
  color?: { id: string; name: string; slug: string; hex?: string | null; createdAt?: Date; active?: boolean } | null;
  size?: { id: string; name: string; slug: string; createdAt?: Date; active?: boolean } | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  images?: string[];
};

export default function VariantSelector({
  variants,
  product,
  cart,
}: {
  variants: Variant[];
  product: Product;
  cart?: Cart;
}) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  const colors = useMemo(() => {
    let filtered = variants;
    if (selectedSize) {
      filtered = filtered.filter((v) => v.size?.slug === selectedSize);
    }
    const map = new Map<string, { id: string; name: string; slug: string; hex?: string | null }>();
    filtered.forEach((v) => {
      if (v.color) map.set(v.color.slug, v.color);
    });
    return Array.from(map.values());
  }, [variants, selectedSize]);

  const sizes = useMemo(() => {
    let filtered = variants;
    if (selectedColor) {
      filtered = filtered.filter((v) => v.color?.slug === selectedColor);
    }
    const map = new Map<string, { id: string; name: string; slug: string }>();
    filtered.forEach((v) => {
      if (v.size) map.set(v.size.slug, v.size);
    });
    return Array.from(map.values());
  }, [variants, selectedColor]);

  const selectedVariant = useMemo(() => {
    let filtered = variants;
    
    if (selectedColor) {
      filtered = filtered.filter((v) => v.color?.slug === selectedColor);
    }
    
    if (selectedSize) {
      filtered = filtered.filter((v) => v.size?.slug === selectedSize);
    }
    
    return filtered[0];
  }, [variants, selectedColor, selectedSize]);

  const variantImage = selectedVariant?.images?.[0];
  const productImage = product.images?.[0];
  const image = variantImage || productImage;

  const item: CartItem = {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    qty: 1,
    image: image || '',
    price: (selectedVariant?.price ?? product.price).toString(),
    variantId: selectedVariant?.id,
    variantColor: selectedVariant?.color?.name,
    variantSize: selectedVariant?.size?.name,
  } as unknown as CartItem;

  return (
    <div className='space-y-4'>
      {colors.length > 0 && (
        <div>
          <label className='block text-sm font-medium mb-1'>Color</label>
          <select
            className='w-full border rounded px-2 py-1'
            value={selectedColor || ''}
            onChange={(e) => setSelectedColor(e.target.value || undefined)}
          >
            <option value=''>Select color</option>
            {colors.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <label className='block text-sm font-medium mb-1'>Size</label>
          <select
            className='w-full border rounded px-2 py-1'
            value={selectedSize || ''}
            onChange={(e) => setSelectedSize(e.target.value || undefined)}
          >
            <option value=''>Select size</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className='flex items-center justify-between'>
        <ProductPrice value={Number(selectedVariant?.price ?? product.price)} />
      </div>

      {((!colors.length && !sizes.length) || selectedVariant) && image ? (
        <div>
          <AddToCart cart={cart} item={item} />
        </div>
      ) : (
        <p className='text-sm text-gray-500'>Please select color and size</p>
      )}
    </div>
  );
}