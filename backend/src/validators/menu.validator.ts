import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(1, 'Price must be at least 1 cent'),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1).optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(1).optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.number().min(1).optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
