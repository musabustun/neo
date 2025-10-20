import { Request, Response } from 'express';
import { prisma } from '../server';
import { io } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createOrderSchema } from '../validators/order.validator';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validatedData = createOrderSchema.parse(req.body);

  // Get menu items and calculate total
  const menuItemIds = validatedData.items.map(item => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      isAvailable: true,
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    throw new AppError('Some menu items are not available', 400);
  }

  // Calculate total amount
  let totalAmount = 0;
  const orderItemsData = validatedData.items.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }
    const itemTotal = menuItem.price * item.quantity;
    totalAmount += itemTotal;
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      priceAtOrder: menuItem.price,
    };
  });

  // Get user wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  if (wallet.balance < totalAmount) {
    throw new AppError('Insufficient balance', 400);
  }

  // Create order and deduct from wallet in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        roomId: validatedData.roomId,
        totalAmount,
        notes: validatedData.notes,
        isPaid: true,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        room: true,
      },
    });

    // Deduct from wallet
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: totalAmount,
        },
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'ORDER_PAYMENT',
        amount: -totalAmount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - totalAmount,
        description: `Order #${newOrder.id.substring(0, 8)}`,
      },
    });

    return newOrder;
  });

  // Broadcast new order via WebSocket
  io.emit('order:new', {
    orderId: order.id,
    userId,
    roomId: order.roomId,
    totalAmount,
  });

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order placed successfully',
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, limit = 10, offset = 0 } = req.query;

  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await prisma.order.count({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
  });

  res.json({
    success: true,
    count: orders.length,
    total: totalCount,
    data: orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      room: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns this order or is admin
  if (order.userId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.json({
    success: true,
    data: order,
  });
});

// @desc    Get active orders (pending, preparing, ready)
// @route   GET /api/orders/active/list
// @access  Private
export const getActiveOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: {
        in: ['PENDING', 'PREPARING', 'READY'],
      },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
});
