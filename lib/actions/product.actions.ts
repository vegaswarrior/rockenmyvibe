'use server';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Type for variant creation
type VariantInput = {
  productId: string;
  colorId: string;
  sizeId: string;
  price: number;
  stock: number;
  images: string[];
};

// Get latest products
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: 'desc' },
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    }))
  );
}

// Get single product by it's slug
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug: slug },
    include: { variants: { include: { color: true, size: true } } },
  });
  return convertToPlainObject(product);
}

// Get all colors
export async function getAllColors() {
  return await prisma.color.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
}

// Get all sizes
export async function getAllSizes() {
  return await prisma.size.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
}

// Get variants for a product by product id
export async function getVariantsByProductId(productId: string) {
  return await prisma.productVariant.findMany({ where: { productId }, include: { color: true, size: true } });
}

// Get single product by it's ID
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
  });

  if (!data) return null;

  const normalized = {
    ...data,
    price: Number(data.price),
    rating: Number(data.rating),
  };

  return convertToPlainObject(normalized);
}

// Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  // Query filter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  // Category filter
  const categoryFilter = category && category !== 'all' ? { category } : {};

  // Price filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== 'all'
      ? {
          price: {
            gte: Number(price.split('-')[0]),
            lte: Number(price.split('-')[1]),
          },
        }
      : {};

  // Rating filter
  const ratingFilter =
    rating && rating !== 'all'
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const data = await prisma.product.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    },
    orderBy:
      sort === 'lowest'
        ? { price: 'asc' }
        : sort === 'highest'
        ? { price: 'desc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count();

  return {
    data: data.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    })),
    totalPages: Math.ceil(dataCount / limit),
  };
}


// Delete a product
export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.delete({ where: { id } });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const product = insertProductSchema.parse(data);
    
    // Extract only Product model fields, excluding colorIds and sizeIds
    const { colorIds, sizeIds, ...productData } = product;
    
    // create product and optionally create variants from provided colorIds/sizeIds
    const created = await prisma.product.create({ data: productData });

    if (colorIds && sizeIds) {
      const variants: VariantInput[] = [];
      for (const colorId of colorIds) {
        for (const sizeId of sizeIds) {
          variants.push({
            productId: created.id,
            colorId,
            sizeId,
            price: Number(product.price),
            stock: product.stock,
            images: product.images || [],
          });
        }
      }
      if (variants.length) {
        await prisma.productVariant.createMany({ data: variants });
      }
    }

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product created successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error('Product not found');

    // Update product and optionally refresh variants
    await prisma.$transaction(async (tx) => {
      // Extract only Product model fields, excluding colorIds and sizeIds
      const { colorIds, sizeIds, ...productData } = product;
      
      await tx.product.update({ where: { id: product.id }, data: productData });

      // If colorIds and sizeIds provided, remove existing variants and recreate
      if (colorIds && sizeIds) {
        await tx.productVariant.deleteMany({ where: { productId: product.id } });
        const variants: VariantInput[] = [];
        for (const colorId of colorIds) {
          for (const sizeId of sizeIds) {
            variants.push({
              productId: product.id,
              colorId,
              sizeId,
              price: Number(product.price),
              stock: product.stock,
              images: product.images || [],
            });
          }
        }
        if (variants.length) {
          await tx.productVariant.createMany({ data: variants });
        }
      }
    });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories
export async function getAllCategories() {
  const data = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
  });

  return data;
}

// Get featured products
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    }))
  );
}