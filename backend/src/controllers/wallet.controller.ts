import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import AppError from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { addFundsSchema } from '../validators/wallet.validator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// @desc    Get wallet balance and info
// @route   GET /api/wallet
// @access  Private
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  res.json({
    success: true,
    data: wallet,
  });
});

// @desc    Add funds to wallet via Stripe
// @route   POST /api/wallet/add-funds
// @access  Private
export const addFunds = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const validatedData = addFundsSchema.parse(req.body);

  // Get user and wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    throw new AppError('User or wallet not found', 404);
  }

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validatedData.amount,
      currency: 'usd',
      payment_method: validatedData.paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: user.id,
        email: user.email,
        type: 'wallet_deposit',
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Add funds to wallet and create transaction record
      const updatedWallet = await prisma.$transaction(async (tx) => {
        // Update wallet balance
        const wallet = await tx.wallet.update({
          where: { userId },
          data: {
            balance: {
              increment: validatedData.amount,
            },
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEPOSIT',
            amount: validatedData.amount,
            balanceBefore: user.wallet!.balance,
            balanceAfter: wallet.balance,
            description: `Deposit via Stripe`,
            stripePaymentId: paymentIntent.id,
          },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            userId,
            amount: validatedData.amount,
            stripePaymentId: paymentIntent.id,
            status: 'succeeded',
            type: 'wallet_deposit',
          },
        });

        return wallet;
      });

      res.json({
        success: true,
        data: {
          wallet: updatedWallet,
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
          },
        },
        message: 'Funds added successfully',
      });
    } else {
      throw new AppError('Payment failed', 400);
    }
  } catch (error: any) {
    if (error.type === 'StripeCardError') {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Payment processing failed', 500);
  }
});

// @desc    Get transaction history
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { limit = 20, offset = 0, type } = req.query;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      walletId: wallet.id,
      ...(type && { type: type as any }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await prisma.transaction.count({
    where: {
      walletId: wallet.id,
      ...(type && { type: type as any }),
    },
  });

  res.json({
    success: true,
    count: transactions.length,
    total: totalCount,
    data: transactions,
  });
});

// @desc    Create Stripe payment intent
// @route   POST /api/wallet/create-payment-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { amount } = req.body;

  if (!amount || amount < 500) {
    throw new AppError('Amount must be at least 500 cents ($5)', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        email: user.email,
        type: 'wallet_deposit',
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error: any) {
    throw new AppError('Failed to create payment intent', 500);
  }
});

// @desc    Handle Stripe webhook
// @route   POST /api/wallet/webhook
// @access  Public (but verified by Stripe signature)
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    throw new AppError(`Webhook Error: ${err.message}`, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update payment record
      await prisma.payment.updateMany({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        data: {
          status: 'succeeded',
        },
      });
      
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      
      // Update payment record
      await prisma.payment.updateMany({
        where: {
          stripePaymentId: failedPayment.id,
        },
        data: {
          status: 'failed',
        },
      });
      
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});
