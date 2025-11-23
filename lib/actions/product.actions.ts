"use server";
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { fetchPrintfulStoreProducts, fetchPrintfulStoreProduct } from '../printful';

type PrintfulVariantOption = {
  name?: string;
  type?: string;
  value?: string;
};

type PrintfulVariant = {
  id: string | number;
  sku?: string | null;
  retail_price?: string | number | null;
  name?: string | null;
  product?: {
    thumbnail_url?: string;
    options?: PrintfulVariantOption[];
  };
  files?: { preview_url?: string }[];
};

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

// Sync products from Printful Store API into local Product/ProductVariant tables
export async function syncProductsFromPrintful() {
  try {
    type PrintfulStoreItem = {
      id: number | string;
      name?: string;
      thumbnail_url?: string;
      retail_price?: string | number | null;
    };

    const storeProducts = (await fetchPrintfulStoreProducts()) as PrintfulStoreItem[];

    for (const p of storeProducts) {
      const detailed = (await fetchPrintfulStoreProduct(p.id)) as {
        sync_product?: {
          name?: string;
          type?: string;
          thumbnail_url?: string;
          retail_price?: string | number | null;
          description?: string | null;
        };
        sync_variants?: PrintfulVariant[];
      };

      const name: string = detailed?.sync_product?.name ?? p.name ?? 'Untitled Product';
      const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slug = slugBase || `printful-product-${p.id}`;

      const category: string =
        (detailed?.sync_product?.type as string | undefined) || 'Printful';

      const imageUrl: string | undefined =
        detailed?.sync_product?.thumbnail_url || p.thumbnail_url;

      const syncVariants: PrintfulVariant[] =
        (detailed?.sync_variants as PrintfulVariant[] | undefined) ?? [];

      const firstVariantPrice = syncVariants.length
        ? Number(syncVariants[0].retail_price ?? 0)
        : 0;

      const retailPrice = Number(
        detailed?.sync_product?.retail_price ?? p.retail_price ?? firstVariantPrice ?? 0,
      );

      const product = await prisma.product.upsert({
        where: { slug }, // slug is unique, use it as the upsert key
        update: {
          name,
          category,
          images: imageUrl ? [imageUrl] : [],
          price: retailPrice,
          brand: 'Printful',
          description: detailed?.sync_product?.description ?? '',
        },
        create: {
          name,
          slug,
          category,
          images: imageUrl ? [imageUrl] : [],
          brand: 'Printful',
          description: detailed?.sync_product?.description ?? '',
          stock: 9999,
          price: retailPrice,
        },
      });

      for (const v of syncVariants) {
        const variantRetailPrice = Number(
          v.retail_price ?? retailPrice ?? 0,
        );

        // Try to derive color / size names from Printful variant options
        let colorId: string | undefined;
        let sizeId: string | undefined;

        const options: PrintfulVariantOption[] = v.product?.options ?? [];
        const colorOption = options.find((o) =>
          typeof o.name === 'string'
            ? o.name.toLowerCase() === 'color'
            : o.type === 'color',
        );
        const sizeOption = options.find((o) =>
          typeof o.name === 'string'
            ? o.name.toLowerCase() === 'size'
            : o.type === 'size',
        );

        if (colorOption?.value) {
          const colorName = String(colorOption.value);
          const colorSlug = colorName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const color = await prisma.color.upsert({
            where: { slug: colorSlug },
            update: {},
            create: { name: colorName, slug: colorSlug },
          });
          colorId = color.id;
        }

        if (sizeOption?.value) {
          const sizeName = String(sizeOption.value);
          const sizeSlug = sizeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const size = await prisma.size.upsert({
            where: { slug: sizeSlug },
            update: {},
            create: { name: sizeName, slug: sizeSlug },
          });
          sizeId = size.id;
        }

        // Fallback: if color/size options are not present, try to parse from variant name.
        // Many Printful variants use a pattern like "Product Name / Color / Size".
        if ((!colorId || !sizeId) && v.name) {
          const parts = String(v.name)
            .split(/[\/,-]/)
            .map((p: string) => p.trim())
            .filter(Boolean);

          // If we have at least 3 parts, assume: [ProductName, Color, Size]
          if (!colorId && parts.length >= 3) {
            const colorName = parts[parts.length - 2];
            const colorSlug = colorName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const color = await prisma.color.upsert({
              where: { slug: colorSlug },
              update: {},
              create: { name: colorName, slug: colorSlug },
            });
            colorId = color.id;
          }

          // Last part is most likely the size
          if (!sizeId && parts.length >= 2) {
            const sizeName = parts[parts.length - 1];
            const sizeSlug = sizeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const size = await prisma.size.upsert({
              where: { slug: sizeSlug },
              update: {},
              create: { name: sizeName, slug: sizeSlug },
            });
            sizeId = size.id;
          }
        }

        // Prefer per-variant garment thumbnail; fall back to design preview if needed
        const variantImage: string | undefined =
          v.product?.thumbnail_url || (v.files && v.files[0]?.preview_url);

        await prisma.productVariant.upsert({
          where: { sku: v.sku ?? undefined },
          update: {
            price: variantRetailPrice,
            images: variantImage ? [variantImage] : [],
            colorId,
            sizeId,
          },
          create: {
            productId: product.id,
            sku: v.sku,
            price: variantRetailPrice,
            stock: 9999,
            images: variantImage ? [variantImage] : [],
            colorId,
            sizeId,
          },
        });
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/search');
    revalidatePath('/');

    return { success: true, message: 'Products synced from Printful' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
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