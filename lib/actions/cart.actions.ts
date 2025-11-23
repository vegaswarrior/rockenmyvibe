'use server';

import { cookies } from 'next/headers';
import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { cartItemSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Calculate cart prices with dynamic settings
const calcPrice = async (
  items: CartItem[],
  promoCodeId?: string
) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
  );

  const [shippingSettings, taxSettings, promoCode] = await Promise.all([
    prisma.shippingSettings.findFirst(),
    prisma.taxSettings.findFirst(),
    promoCodeId
      ? prisma.promoCode.findFirst({
          where: { id: promoCodeId },
        })
      : null,
  ]);

  const baseShippingCost = shippingSettings
    ? Number(shippingSettings.baseShippingCost)
    : 10;
  const freeShippingThreshold = shippingSettings
    ? Number(shippingSettings.freeShippingThreshold)
    : 100;
  const taxRate = taxSettings ? Number(taxSettings.taxRate) / 100 : 0.15;

  let shippingPrice = itemsPrice > freeShippingThreshold ? 0 : baseShippingCost;
  shippingPrice = round2(shippingPrice);

  let discountedPrice = itemsPrice;
  if (promoCode && promoCode.isActive) {
    if (
      !promoCode.minOrderAmount ||
      itemsPrice >= Number(promoCode.minOrderAmount)
    ) {
      const discountValue = Number(promoCode.discountValue);

      if (promoCode.discountType === 'percentage') {
        discountedPrice = round2(itemsPrice * (1 - discountValue / 100));
      } else {
        discountedPrice = round2(Math.max(0, itemsPrice - discountValue));
      }
    }
  }

  const taxPrice = round2(discountedPrice * taxRate);
  const totalPrice = round2(discountedPrice + taxPrice + shippingPrice);

  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};

export async function applyPromoCodeToCart(code: string) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!promoCode) {
      throw new Error('Promo code is invalid or inactive');
    }

    const prices = await calcPrice(cart.items as CartItem[], promoCode.id);

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...prices,
      },
    });

    return {
      success: true,
      message: 'Promo code applied',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function addItemToCart(data: CartItem) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    // Find product in database
    const product = await prisma.product.findFirst({ where: { id: item.productId } });
    if (!product) throw new Error('Product not found');

    // If variant provided, fetch it
    const variant = item.variantId
      ? await prisma.productVariant.findUnique({ where: { id: item.variantId } })
      : null;

    if (!cart) {
      const prices = await calcPrice([item]);
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...prices,
      });

      await prisma.cart.create({
        data: newCart,
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId && x.variantId === item.variantId
      );

      if (existItem) {
        const available = variant ? variant.stock : product.stock;
        if (available < existItem.qty + 1) {
          throw new Error('Not enough stock');
        }

        (cart.items as CartItem[]).find(
          (x) => x.productId === item.productId && x.variantId === item.variantId
        )!.qty = existItem.qty + 1;
      } else {
        const available = variant ? variant.stock : product.stock;
        if (available < 1) throw new Error('Not enough stock');

        cart.items.push(item);
      }

      const prices = await calcPrice(cart.items as CartItem[]);
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...prices,
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('Cart session not found');

  // Get session and user ID
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) return undefined;

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: Number(cart.itemsPrice),
    totalPrice: Number(cart.totalPrice),
    shippingPrice: Number(cart.shippingPrice),
    taxPrice: Number(cart.taxPrice),
  });
}

export async function removeItemFromCart(productId: string, variantId?: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get Product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) throw new Error('Product not found');

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error('Cart not found');

    // Check for item (consider variantId when provided)
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId && (variantId ? x.variantId === variantId : true)
    );
    if (!exist) throw new Error('Item not found');

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart (filter by productId+variantId if variant provided)
      cart.items = (cart.items as CartItem[]).filter(
        (x) => !(x.productId === exist.productId && (variantId ? x.variantId === variantId : true))
      );
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find(
        (x) => x.productId === productId && (variantId ? x.variantId === variantId : true)
      )!.qty = exist.qty - 1;
    }

    const prices = await calcPrice(cart.items as CartItem[]);
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...prices,
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
