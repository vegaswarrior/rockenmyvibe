'use server';
import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertOrderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult, ShippingAddress } from '@/types';
import { paypal } from '../paypal';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { sendPurchaseReceipt } from '@/email';

// ---------- Type Guard Helpers ---------- //
function isShippingAddress(data: unknown): data is ShippingAddress {
  return (
    data !== null &&
    typeof data === 'object' &&
    'fullName' in data &&
    'address' in data &&
    'city' in data &&
    'postalCode' in data &&
    'country' in data
  );
}

function isPaymentResult(data: unknown): data is PaymentResult {
  return (
    data !== null &&
    typeof data === 'object' &&
    'id' in data &&
    'status' in data &&
    'pricePaid' in data &&
    'email_address' in data
  );
}

// ---------- Main Actions ---------- //

// Create order and order items
export async function createOrder() {
  try {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');

    const user = await getUserById(userId);
    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Your cart is empty', redirectTo: '/cart' };
    }
    if (!user.address) {
      return { success: false, message: 'No shipping address', redirectTo: '/shipping-address' };
    }
    if (!user.paymentMethod) {
      return { success: false, message: 'No payment method', redirectTo: '/' };
    }

    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({ data: order });

      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: { ...item, price: item.price, orderId: insertedOrder.id },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { items: [], totalPrice: 0, taxPrice: 0, shippingPrice: 0, itemsPrice: 0 },
      });

      return insertedOrder.id;
    });

    if (insertedOrderId) {
      const { generateTrackingNumberForOrder } = await import('./tracking.actions');
      await generateTrackingNumberForOrder(insertedOrderId);
    }

    return insertedOrderId
      ? { success: true, message: 'Order created', redirectTo: `/order/${insertedOrderId}` }
      : { success: false, message: 'Order not created' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    return { success: false, message: formatError(error) };
  }
}

// Get single order
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: { id: orderId },
    include: { orderitems: true, user: { select: { name: true, email: true } } },
  });

  if (!data) return null;

  const convertedData = {
    ...data,
    totalPrice: Number(data.totalPrice),
    itemsPrice: Number(data.itemsPrice),
    shippingPrice: Number(data.shippingPrice),
    taxPrice: Number(data.taxPrice),
    orderitems: data.orderitems.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };

  return convertToPlainObject(convertedData);
}

// Create new PayPal order
export async function createPayPalOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: paypalOrder.id,
          email_address: '',
          status: '',
          pricePaid: 0,
        },
      },
    });

    return { success: true, message: 'Paypal order created', data: paypalOrder.id };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Approve PayPal payment
export async function approvePayPalOrder(orderId: string, data: { orderID: string }) {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const captureData = await paypal.capturePayment(data.orderID);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Invalid PayPal response');
    }

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Order paid successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Mark order as paid
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { orderitems: true, user: { select: { name: true, email: true } } },
  });

  if (!order) throw new Error('Order not found');
  if (order.isPaid) throw new Error('Order already paid');

  await prisma.$transaction(async (tx) => {
    for (const item of order.orderitems) {
      const qty = item.qty;
      const variantId = item.variantId;

      if (variantId) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: qty } },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: qty } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: qty } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { isPaid: true, paidAt: new Date(), paymentResult },
    });
  });

  const updatedOrder = await prisma.order.findFirst({
    where: { id: orderId },
    include: { orderitems: true, user: { select: { name: true, email: true } } },
  });

  if (!updatedOrder) throw new Error('Order not found after update');

  if (
    isShippingAddress(updatedOrder.shippingAddress) &&
    isPaymentResult(updatedOrder.paymentResult)
  ) {
    const shippingAddress = updatedOrder.shippingAddress as ShippingAddress;
    const paymentResult = updatedOrder.paymentResult as PaymentResult;

    const normalizedOrder = {
      ...updatedOrder,
      totalPrice: Number(updatedOrder.totalPrice),
      itemsPrice: Number(updatedOrder.itemsPrice),
      shippingPrice: Number(updatedOrder.shippingPrice),
      taxPrice: Number(updatedOrder.taxPrice),
      orderitems: updatedOrder.orderitems.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
      shippingAddress,
      paymentResult,
    };

    sendPurchaseReceipt({
      order: {
        ...normalizedOrder,
        shippingAddress: normalizedOrder.shippingAddress,
        paymentResult: normalizedOrder.paymentResult,
      },
    }).catch((error) => {
      console.error('Failed to send purchase receipt:', error);
    });
  } else {
    console.error('Invalid address or payment result:', updatedOrder);
  }
}

// Get user's orders
export async function getMyOrders({ limit = PAGE_SIZE, page }: { limit?: number; page: number }) {
  const session = await auth();
  if (!session) throw new Error('User not authorized');

  const data = await prisma.order.findMany({
    where: { userId: session.user?.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({ where: { userId: session?.user?.id } });

  const convertedData = data.map((order) => ({
    ...order,
    totalPrice: Number(order.totalPrice),
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
  }));

  return { data: convertedData, totalPages: Math.ceil(dataCount / limit) };
}

// Order summary
export async function getOrderSummary() {
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  const totalSales = await prisma.order.aggregate({ _sum: { totalPrice: true } });

  const rawSales = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

  const salesData = rawSales.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
    take: 6,
  });

  return { ordersCount, productsCount, usersCount, totalSales, latestSales, salesData };
}

// Admin: Get all orders
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.OrderWhereInput =
    query && query !== 'all'
      ? {
          user: {
            name: { contains: query, mode: 'insensitive' } as Prisma.StringFilter,
          },
        }
      : {};

  const data = await prisma.order.findMany({
    where: queryFilter,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: { user: { select: { name: true } }, orderitems: { select: { image: true, name: true } } },
  });

  const dataCount = await prisma.order.count();

  return { data: convertToPlainObject(data), totalPages: Math.ceil(dataCount / limit) };
}

// Delete an order
export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({ where: { id } });
    revalidatePath('/admin/orders');
    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Mark COD order as paid
export async function updateOrderToPaidCOD(orderId: string) {
  try {
    await updateOrderToPaid({ orderId });
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: 'COD order marked as paid' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Mark order as delivered
export async function deliverOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (!order.isPaid) throw new Error('Order not paid');

    await prisma.order.update({
      where: { id: orderId },
      data: { isDelivered: true, deliveredAt: new Date() },
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Order marked as delivered' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getRevenueByPeriod(
  period: 'day' | 'month' | 'year',
  filterDate?: { year?: number; month?: number }
) {
  const queryMap = {
    day: `SELECT to_char("createdAt", 'YYYY-MM-DD') as "date", 
             to_char("createdAt", 'DD Mon YYYY') as "displayDate",
             sum("totalPrice") as "totalRevenue",
             count(*) as "orderCount"
          FROM "Order"
          WHERE "isPaid" = true
          ${filterDate?.year && filterDate?.month ? `AND EXTRACT(YEAR FROM "createdAt") = ${filterDate.year} AND EXTRACT(MONTH FROM "createdAt") = ${filterDate.month}` : filterDate?.year ? `AND EXTRACT(YEAR FROM "createdAt") = ${filterDate.year}` : ''}
          GROUP BY to_char("createdAt", 'YYYY-MM-DD'), to_char("createdAt", 'DD Mon YYYY')
          ORDER BY "date" DESC`,

    month: `SELECT to_char("createdAt", 'YYYY-MM') as "date",
               to_char("createdAt", 'Mon YYYY') as "displayDate",
               sum("totalPrice") as "totalRevenue",
               count(*) as "orderCount"
            FROM "Order"
            WHERE "isPaid" = true
            ${filterDate?.year ? `AND EXTRACT(YEAR FROM "createdAt") = ${filterDate.year}` : ''}
            GROUP BY to_char("createdAt", 'YYYY-MM'), to_char("createdAt", 'Mon YYYY')
            ORDER BY "date" DESC`,

    year: `SELECT to_char("createdAt", 'YYYY') as "date",
              to_char("createdAt", 'YYYY') as "displayDate",
              sum("totalPrice") as "totalRevenue",
              count(*) as "orderCount"
           FROM "Order"
           WHERE "isPaid" = true
           GROUP BY to_char("createdAt", 'YYYY')
           ORDER BY "date" DESC`,
  };

  const rawData = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      displayDate: string;
      totalRevenue: Prisma.Decimal;
      orderCount: number;
    }>
  >(queryMap[period]);

  const data = rawData.map((item) => ({
    date: item.date,
    displayDate: item.displayDate,
    totalRevenue: Number(item.totalRevenue),
    orderCount: item.orderCount,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  return { data, totalRevenue };
}