import { Request, Response } from 'express';
import { prisma } from '../server';
import { io } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Start a new session (scan QR and unlock door)
// @route   POST /api/sessions/start
// @access  Private
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.body;
  const userId = req.user!.id;

  if (!roomId) {
    throw new AppError('Room ID is required', 400);
  }

  // Check if user has an active session
  const existingActiveSession = await prisma.session.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (existingActiveSession) {
    throw new AppError('You already have an active session', 400);
  }

  // Get room and check availability
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.status !== 'AVAILABLE') {
    throw new AppError('Room is not available', 400);
  }

  // Check if room has an active session
  const roomActiveSession = await prisma.session.findFirst({
    where: {
      roomId: room.id,
      status: 'ACTIVE',
    },
  });

  if (roomActiveSession) {
    throw new AppError('Room already has an active session', 400);
  }

  // Check user wallet balance (should have at least 30 minutes worth)
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  const minimumBalance = room.pricePerMinute * 30; // 30 minutes minimum

  if (!wallet || wallet.balance < minimumBalance) {
    throw new AppError(`Insufficient balance. Minimum ${minimumBalance} cents required`, 400);
  }

  // Start session and update room status in a transaction
  const session = await prisma.$transaction(async (tx) => {
    // Create session
    const newSession = await tx.session.create({
      data: {
        userId,
        roomId: room.id,
        status: 'ACTIVE',
        costPerMinute: room.pricePerMinute,
        startTime: new Date(),
      },
      include: {
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

    // Update room status to OCCUPIED
    await tx.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });

    return newSession;
  });

  // Broadcast room status change via WebSocket
  io.emit('room:status', {
    roomId: room.id,
    status: 'OCCUPIED',
    sessionId: session.id,
  });

  res.status(201).json({
    success: true,
    data: session,
    message: 'Session started successfully. Door unlocked!',
  });
});

// @desc    End a session
// @route   POST /api/sessions/:id/end
// @access  Private
export const endSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Get session
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      room: true,
      user: true,
    },
  });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Check if user owns this session
  if (session.userId !== userId) {
    throw new AppError('Not authorized to end this session', 403);
  }

  if (session.status !== 'ACTIVE') {
    throw new AppError('Session is not active', 400);
  }

  const endTime = new Date();
  const startTime = new Date(session.startTime);
  
  // Calculate duration in minutes (round up)
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.ceil(durationMs / (1000 * 60));
  
  // Calculate total cost
  const totalCost = durationMinutes * session.costPerMinute;

  // Get user wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  if (wallet.balance < totalCost) {
    throw new AppError('Insufficient balance to complete session', 400);
  }

  // End session, update room, deduct from wallet in transaction
  const updatedSession = await prisma.$transaction(async (tx) => {
    // Update session
    const updated = await tx.session.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime,
        duration: durationMinutes,
        totalCost,
        isPaid: true,
      },
      include: {
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

    // Deduct from wallet
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: totalCost,
        },
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'SESSION_PAYMENT',
        amount: -totalCost,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - totalCost,
        description: `Session payment for room ${session.room.name} (${durationMinutes} minutes)`,
      },
    });

    // Update room status to AVAILABLE
    await tx.room.update({
      where: { id: session.roomId },
      data: { status: 'AVAILABLE' },
    });

    return updated;
  });

  // Broadcast room status change via WebSocket
  io.emit('room:status', {
    roomId: session.roomId,
    status: 'AVAILABLE',
    sessionId: null,
  });

  // Broadcast session update
  io.emit('session:ended', {
    sessionId: id,
    userId,
    totalCost,
    duration: durationMinutes,
  });

  res.json({
    success: true,
    data: updatedSession,
    message: 'Session ended successfully',
  });
});

// @desc    Get user's active session
// @route   GET /api/sessions/active
// @access  Private
export const getActiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const session = await prisma.session.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      room: true,
    },
  });

  if (!session) {
    return res.json({
      success: true,
      data: null,
    });
  }

  // Calculate current duration and cost
  const now = new Date();
  const startTime = new Date(session.startTime);
  const durationMs = now.getTime() - startTime.getTime();
  const durationMinutes = Math.ceil(durationMs / (1000 * 60));
  const currentCost = durationMinutes * session.costPerMinute;

  res.json({
    success: true,
    data: {
      ...session,
      currentDuration: durationMinutes,
      currentCost,
    },
  });
});

// @desc    Get session history
// @route   GET /api/sessions/history
// @access  Private
export const getSessionHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { limit = 10, offset = 0 } = req.query;

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
          consoleType: true,
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
    where: {
      userId,
      status: 'COMPLETED',
    },
  });

  res.json({
    success: true,
    count: sessions.length,
    total: totalCount,
    data: sessions,
  });
});

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
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

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Check if user owns this session or is admin
  if (session.userId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Not authorized to view this session', 403);
  }

  res.json({
    success: true,
    data: session,
  });
});
