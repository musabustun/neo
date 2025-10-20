import express from 'express';
import {
  getStats,
  getRecentActivity,
  createRoom,
  updateRoom,
  deleteRoom,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getAllSessions,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard & Stats
router.get('/stats', getStats);
router.get('/activity', getRecentActivity);

// Room Management
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Menu Management
router.post('/menu', createMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

// Order Management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// User Management
router.get('/users', getAllUsers);

// Session Management
router.get('/sessions', getAllSessions);

export default router;
