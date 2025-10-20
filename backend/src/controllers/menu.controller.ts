import { Request, Response } from 'express';
import { prisma } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
export const getMenuItems = asyncHandler(async (req: Request, res: Response) => {
  const { category, isAvailable } = req.query;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      ...(category && { category: category as string }),
      ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' }),
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  res.json({
    success: true,
    count: menuItems.length,
    data: menuItems,
  });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
export const getMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.json({
    success: true,
    data: menuItem,
  });
});

// @desc    Get menu categories
// @route   GET /api/menu/categories
// @access  Public
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    select: { category: true },
    distinct: ['category'],
  });

  const categoryNames = categories.map(c => c.category);

  res.json({
    success: true,
    data: categoryNames,
  });
});
