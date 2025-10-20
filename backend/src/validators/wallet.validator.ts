import { z } from 'zod';

export const addFundsSchema = z.object({
  amount: z.number().min(500, 'Minimum deposit is 500 cents ($5)').max(100000, 'Maximum deposit is 100000 cents ($1000)'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
});

export type AddFundsInput = z.infer<typeof addFundsSchema>;
