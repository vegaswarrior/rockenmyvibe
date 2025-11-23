"use server";

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  try {
    const [shipping, tax] = await Promise.all([
      prisma.shippingSettings.findFirst(),
      prisma.taxSettings.findFirst(),
    ]);

    return {
      success: true,
      data: {
        shipping: shipping ? {
          baseShippingCost: shipping.baseShippingCost.toString(),
          freeShippingThreshold: shipping.freeShippingThreshold.toString(),
          uspsIntegrationEnabled: shipping.uspsIntegrationEnabled,
        } : {
          baseShippingCost: '10.00',
          freeShippingThreshold: '100.00',
          uspsIntegrationEnabled: false,
        },
        tax: tax ? {
          taxRate: tax.taxRate.toString(),
        } : { taxRate: '15.00' },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      data: {
        shipping: {
          baseShippingCost: '10.00',
          freeShippingThreshold: '100.00',
          uspsIntegrationEnabled: false,
        },
        tax: { taxRate: '15.00' },
      },
    };
  }
}

export async function updateShippingSettings(
  baseShippingCost: number,
  freeShippingThreshold: number,
  uspsIntegrationEnabled: boolean
) {
  try {
    const existing = await prisma.shippingSettings.findFirst();

    if (existing) {
      await prisma.shippingSettings.update({
        where: { id: existing.id },
        data: {
          baseShippingCost,
          freeShippingThreshold,
          uspsIntegrationEnabled,
        },
      });
    } else {
      await prisma.shippingSettings.create({
        data: {
          baseShippingCost,
          freeShippingThreshold,
          uspsIntegrationEnabled,
        },
      });
    }

    return { success: true, message: 'Shipping settings updated' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateTaxSettings(taxRate: number) {
  try {
    const existing = await prisma.taxSettings.findFirst();

    if (existing) {
      await prisma.taxSettings.update({
        where: { id: existing.id },
        data: { taxRate },
      });
    } else {
      await prisma.taxSettings.create({
        data: { taxRate },
      });
    }

    return { success: true, message: 'Tax settings updated' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getCoupons() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: coupons.map((coupon) => ({
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), data: [] };
  }
}

export async function createCoupon(data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: Date;
}) {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
      },
    });

    return {
      success: true,
      message: 'Coupon created',
      data: {
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      },
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateCoupon(
  id: string,
  data: {
    description?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxUses?: number;
    isActive?: boolean;
    expiresAt?: Date;
  }
) {
  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return { success: true, message: 'Coupon updated', data: coupon };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await prisma.coupon.delete({ where: { id } });
    return { success: true, message: 'Coupon deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getPromoCodes() {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: promoCodes.map((promo) => ({
        ...promo,
        discountValue: Number(promo.discountValue),
        minOrderAmount: promo.minOrderAmount ? Number(promo.minOrderAmount) : null,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), data: [] };
  }
}

export async function createPromoCode(data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: Date;
}) {
  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
      },
    });

    return {
      success: true,
      message: 'Promo code created',
      data: {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minOrderAmount: promoCode.minOrderAmount ? Number(promoCode.minOrderAmount) : null,
      },
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updatePromoCode(
  id: string,
  data: {
    description?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxUses?: number;
    isActive?: boolean;
    expiresAt?: Date;
  }
) {
  try {
    const promoCode = await prisma.promoCode.update({
      where: { id },
      data,
    });

    return { success: true, message: 'Promo code updated', data: promoCode };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await prisma.promoCode.delete({ where: { id } });
    return { success: true, message: 'Promo code deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function calculateUSPSShippingRate(
  weight: number,
  originZip: string,
  destZip: string,
  serviceType: 'PRIORITY' | 'EXPRESS' | 'GROUND' = 'PRIORITY'
) {
  try {
    const consumerKey = process.env.USPS_CONSUMER_KEY;
    const consumerSecret = process.env.USPS_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      return {
        success: false,
        message: 'USPS credentials not configured',
        rate: null,
      };
    }

    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString('base64');

    const tokenResponse = await fetch(
      'https://apis.usps.com/oauth2/v1/token',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      }
    );

    if (!tokenResponse.ok) {
      return {
        success: false,
        message: 'Failed to authenticate with USPS',
        rate: null,
      };
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    const rateResponse = await fetch(
      'https://apis.usps.com/prices/v3/total-rates',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originZIPCode: originZip,
          destinationZIPCode: destZip,
          weight: {
            value: weight,
            unit: 'LB',
          },
          mailClass: serviceType,
        }),
      }
    );

    if (!rateResponse.ok) {
      return {
        success: false,
        message: 'Failed to get shipping rate from USPS',
        rate: null,
      };
    }

    const rateData = await rateResponse.json() as {
      totalBasePrice?: number;
    };

    return {
      success: true,
      message: 'Rate calculated successfully',
      rate: rateData.totalBasePrice || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      rate: null,
    };
  }
}

// Create or update a promo code and link it to a specific product
export async function addPromoToProduct(params: {
  productId: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: Date;
}) {
  try {
    const upperCode = params.code.toUpperCase();

    // Create or update the promo code itself
    const promo = await prisma.promoCode.upsert({
      where: { code: upperCode },
      update: {
        description: params.description,
        discountType: params.discountType,
        discountValue: params.discountValue,
        minOrderAmount: params.minOrderAmount,
        maxUses: params.maxUses,
        expiresAt: params.expiresAt,
        isActive: true,
      },
      create: {
        code: upperCode,
        description: params.description,
        discountType: params.discountType,
        discountValue: params.discountValue,
        minOrderAmount: params.minOrderAmount,
        maxUses: params.maxUses,
        expiresAt: params.expiresAt,
      },
    });

    // Link promo to product
    await prisma.productPromo.upsert({
      where: {
        productId_promoCodeId: {
          productId: params.productId,
          promoCodeId: promo.id,
        },
      },
      update: {},
      create: {
        productId: params.productId,
        promoCodeId: promo.id,
      },
    });

    revalidatePath('/admin/products');

    return { success: true, message: 'Promo code added to product' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
