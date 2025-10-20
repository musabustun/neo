import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import AppError from '../utils/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err.message, { stack: err.stack });

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    error.message = 'Database error occurred';
    error = new AppError(error.message, 400);
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    error.message = 'Invalid data provided';
    error = new AppError(error.message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error = new AppError(error.message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error = new AppError(error.message, 401);
  }

  const statusCode = (error as AppError).statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
