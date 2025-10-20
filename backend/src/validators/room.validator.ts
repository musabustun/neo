import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  name: z.string().min(1, 'Room name is required'),
  description: z.string().optional(),
  pricePerMinute: z.number().min(1, 'Price per minute must be at least 1 cent'),
  consoleType: z.string().min(1, 'Console type is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  imageUrl: z.string().url().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
  pricePerMinute: z.number().min(1).optional(),
  consoleType: z.string().optional(),
  capacity: z.number().min(1).optional(),
  imageUrl: z.string().url().optional(),
  amenities: z.array(z.string()).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
