import express from 'express';
import {
  getWallet,
  addFunds,
  getTransactions,
  createPaymentIntent,
  handleStripeWebhook,
} from '../controllers/wallet.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// Webhook route (no auth, verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.use(protect);

router.get('/', getWallet);
router.post('/add-funds', addFunds);
router.get('/transactions', getTransactions);
router.post('/create-payment-intent', createPaymentIntent);

export default router;
