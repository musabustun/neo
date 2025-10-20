import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../server';
import { io } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createRoomSchema, updateRoomSchema } from '../validators/room.validator';
import { createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.validator';
import { updateOrderStatusSchema } from '../validators/order.validator';

// Helper function to generate QR code
const generateRoomQRCode = (roomId: string): string => {
  const timestamp = Date.now();
  const secret = process.env.QR_CODE_SECRET || 'default-secret';
  const payload = JSON.stringify({ roomId, timestamp });
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
};

// ============= DASHBOARD & STATS =============

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalRooms,
    activeSessions,
    totalRevenue,
    todayRevenue,
    pendingOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.room.count(),
    prisma.session.count({ where: { status: 'ACTIVE' } }),
    prisma.session.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalCost: true },
    }),
    prisma.session.aggregate({
      where: {
        status: 'COMPLETED',
        endTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { totalCost: true },
    }),
    prisma.order.count({
      where: {
        status: { in: ['PENDING', 'PREPARING'] },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalRooms,
      activeSessions,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      todayRevenue: todayRevenue._sum.totalCost || 0,
      pendingOrders,
    },
  });
});

// @desc    Get recent activity
// @route   GET /api/admin/activity
// @access  Private/Admin
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const [recentSessions, recentOrders] = await Promise.all([
    prisma.session.findMany({
      take: 10,
      orderBy: { startTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    }),
  ]);

  res.json({
    success: true,
    data: {
      recentSessions,
      recentOrders,
    },
  });
});

// ============= ROOM MANAGEMENT =============

// @desc    Create a new room
// @route   POST /api/admin/rooms
// @access  Private/Admin
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createRoomSchema.parse(req.body);

  // Check if room number already exists
  const existingRoom = await prisma.room.findUnique({
    where: { roomNumber: validatedData.roomNumber },
  });

  if (existingRoom) {
    throw new AppError('Room number already exists', 400);
  }

  // Create room with generated QR code
  const room = await prisma.room.create({
    data: {
      ...validatedData,
      qrCode: '', // temporary
      amenities: validatedData.amenities || [],
    },
  });

  // Generate and update QR code
  const qrCode = generateRoomQRCode(room.id);
  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: { qrCode },
  });

  res.status(201).json({
    success: true,
    data: updatedRoom,
  });
});

// @desc    Update a room
// @route   PUT /api/admin/rooms/:id
// @access  Private/Admin
export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateRoomSchema.parse(req.body);

  const room = await prisma.room.findUnique({
    where: { id },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  const updatedRoom = await prisma.room.update({
    where: { id },
    data: validatedData,
  });

  // Broadcast room update
  io.emit('room:updated', updatedRoom);

  res.json({
    success: true,
    data: updatedRoom,
  });
});

// @desc    Delete a room
// @route   DELETE /api/admin/rooms/:id
// @access  Private/Admin
export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      sessions: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.sessions.length > 0) {
    throw new AppError('Cannot delete room with active sessions', 400);
  }

  await prisma.room.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Room deleted successfully',
  });
});

// ============= MENU MANAGEMENT =============

// @desc    Create menu item
// @route   POST /api/admin/menu
// @access  Private/Admin
export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createMenuItemSchema.parse(req.body);

  const menuItem = await prisma.menuItem.create({
    data: validatedData,
  });

  res.status(201).json({
    success: true,
    data: menuItem,
  });
});

// @desc    Update menu item
// @route   PUT /api/admin/menu/:id
// @access  Private/Admin
export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateMenuItemSchema.parse(req.body);

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  const updatedMenuItem = await prisma.menuItem.update({
    where: { id },
    data: validatedData,
  });

  res.json({
    success: true,
    data: updatedMenuItem,
  });
});

// @desc    Delete menu item
// @route   DELETE /api/admin/menu/:id
// @access  Private/Admin
export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  await prisma.menuItem.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Menu item deleted successfully',
  });
});

// ============= ORDER MANAGEMENT =============

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 20, offset = 0 } = req.query;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
        },
      },
      items: {
        include: {
          menuItem: true,
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
    where: status ? { status: status as any } : undefined,
  });

  res.json({
    success: true,
    count: orders.length,
    total: totalCount,
    data: orders,
  });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateOrderStatusSchema.parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: validatedData.status },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  // Broadcast order status update
  io.emit('order:status', {
    orderId: id,
    userId: order.userId,
    status: validatedData.status,
  });

  res.json({
    success: true,
    data: updatedOrder,
  });
});

// ============= USER MANAGEMENT =============

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20, offset = 0, search } = req.query;

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' } },
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      wallet: {
        select: {
          balance: true,
        },
      },
      _count: {
        select: {
          sessions: true,
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await prisma.user.count();

  res.json({
    success: true,
    count: users.length,
    total: totalCount,
    data: users,
  });
});

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private/Admin
export const getAllSessions = asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 20, offset = 0 } = req.query;

  const sessions = await prisma.session.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
      startTime: 'desc',
    },
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await prisma.session.count({
    where: status ? { status: status as any } : undefined,
  });

  res.json({
    success: true,
    count: sessions.length,
    total: totalCount,
    data: sessions,
  });
});
