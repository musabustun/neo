import { Request, Response } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../server';
import { io } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// Generate a unique QR code for a room
const generateRoomQRCode = (roomId: string): string => {
  const timestamp = Date.now();
  const secret = process.env.QR_CODE_SECRET || 'default-secret';
  
  // Create a payload with room info and timestamp
  const payload = JSON.stringify({ roomId, timestamp });
  
  // Create a signature to verify the QR code
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Combine payload and signature
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const rooms = await prisma.room.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { roomNumber: 'asc' },
  });

  res.json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      sessions: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  res.json({
    success: true,
    data: room,
  });
});

// @desc    Verify QR code and get room info
// @route   POST /api/rooms/verify-qr
// @access  Private
export const verifyQRCode = asyncHandler(async (req: Request, res: Response) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    throw new AppError('QR code is required', 400);
  }

  try {
    // Decode the QR code
    const decoded = JSON.parse(Buffer.from(qrCode, 'base64').toString());
    const { payload, signature } = decoded;
    
    // Verify signature
    const secret = process.env.QR_CODE_SECRET || 'default-secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      throw new AppError('Invalid QR code', 400);
    }

    // Parse payload
    const { roomId, timestamp } = JSON.parse(payload);

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // Check if room is available
    if (room.status !== 'AVAILABLE') {
      throw new AppError('Room is not available', 400);
    }

    // Check for active session in this room
    const activeSession = await prisma.session.findFirst({
      where: {
        roomId: room.id,
        status: 'ACTIVE',
      },
    });

    if (activeSession) {
      throw new AppError('Room already has an active session', 400);
    }

    res.json({
      success: true,
      data: {
        room,
        message: 'QR code verified successfully',
      },
    });
  } catch (error) {
    throw new AppError('Invalid QR code format', 400);
  }
});

// @desc    Generate QR code image for a room
// @route   GET /api/rooms/:id/qr-image
// @access  Public
export const getQRCodeImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(room.qrCode);
    
    res.json({
      success: true,
      data: {
        qrCode: room.qrCode,
        qrCodeImage: qrCodeDataUrl,
      },
    });
  } catch (error) {
    throw new AppError('Failed to generate QR code image', 500);
  }
});
