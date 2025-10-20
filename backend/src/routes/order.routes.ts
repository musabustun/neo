import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  getActiveOrders,
} from '../controllers/order.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/active/list', getActiveOrders);
router.get('/:id', getOrder);

export default router;
