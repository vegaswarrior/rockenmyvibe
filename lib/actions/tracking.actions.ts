"use server";
import { prisma } from '@/db/prisma';
import { getUSPSTracking } from '@/lib/usps';
import { revalidatePath } from 'next/cache';
import { convertToPlainObject, formatError } from '../utils';

function generateTrackingNumber(): string {
  const prefix = 'RMVK';
  const randomDigits = Math.random().toString(36).substring(2, 13).toUpperCase();
  return `${prefix}${randomDigits.substring(0, 20)}`;
}

export async function generateTrackingNumberForOrder(orderId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await prisma.order.findFirst({ where: { id: orderId } }) as any;

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.trackingNumber) {
      return {
        success: true,
        message: 'Tracking number already exists',
        trackingNumber: order.trackingNumber,
      };
    }

    const trackingNumber = generateTrackingNumber();

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        trackingStatus: 'pending',
        trackingEvents: [],
      },
    });

    return {
      success: true,
      message: 'Tracking number generated',
      trackingNumber,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getOrderTracking(orderId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order || !order.trackingNumber) {
      return {
        success: false,
        message: 'No tracking information available',
      };
    }

    const plainOrder = convertToPlainObject(order);

    return {
      success: true,
      data: plainOrder,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateOrderTracking(orderId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await prisma.order.findFirst({ where: { id: orderId } }) as any;

    if (!order || !order.trackingNumber) {
      return {
        success: false,
        message: 'No tracking number found for this order',
      };
    }

    const trackingData = await getUSPSTracking(order.trackingNumber);

    const trackingEvents = trackingData.events.map((event) => ({
      timestamp: event.timestamp,
      location: event.location,
      status: event.status,
      description: event.description,
    }));

    const updateData: Record<string, unknown> = {
      trackingStatus: trackingData.status,
      trackingEvents,
      lastTrackingUpdate: new Date(),
    };

    if (
      trackingData.status.toLowerCase() === 'delivered' &&
      !order.isDelivered
    ) {
      updateData.isDelivered = true;
      updateData.deliveredAt = new Date();
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath(`/user/orders`);
    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Tracking updated successfully',
      data: trackingData,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getMyOrdersWithTracking({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}) {
  try {
    const session = await import('@/auth').then((m) => m.auth());

    if (!session?.user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        createdAt: true,
        totalPrice: true,
        isPaid: true,
        isDelivered: true,
        trackingNumber: true,
        trackingStatus: true,
        trackingEvents: true,
        lastTrackingUpdate: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalCount = await prisma.order.count({
      where: { userId: session.user.id },
    });

    return {
      success: true,
      data: orders,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
