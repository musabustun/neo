import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Wallet as WalletIcon, Plus, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { ApiResponse, Wallet, Transaction, ApiListResponse } from '@/types';

export default function WalletPage() {
  const { toast } = useToast();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');

  // Fetch wallet
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Wallet>>('/wallet');
      return response.data.data;
    },
  });

  // Fetch transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<Transaction>>('/wallet/transactions?limit=50');
      return response.data.data;
    },
  });

  const handleAddFunds = () => {
    const cents = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(cents) || cents < 500) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum deposit is $5.00',
      });
      return;
    }

    toast({
      title: 'Add Funds',
      description: 'Stripe integration - In a real app, this would open Stripe payment modal',
    });
    
    // In a real implementation, this would integrate with Stripe Elements
    setShowAddFunds(false);
    setAmount('');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'REFUND':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'WITHDRAWAL':
      case 'SESSION_PAYMENT':
      case 'ORDER_PAYMENT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Manage your balance and transactions
          </p>
        </div>
        <Button onClick={() => setShowAddFunds(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Funds
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <WalletIcon className="h-5 w-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold">
            {formatCurrency(walletData?.balance || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all your wallet transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!transactionsData || transactionsData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-4">
              {transactionsData.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-accent rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description || transaction.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getTransactionColor(transaction.amount)}`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add (minimum $5.00)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="25.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="5"
                step="1"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => setAmount(value.toString())}
                >
                  ${value}
                </Button>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-medium">Payment Methods:</p>
              <p className="text-muted-foreground">
                💳 Credit/Debit Card (Stripe)
              </p>
              <p className="text-xs text-muted-foreground">
                Note: This is a demo. In production, Stripe payment would be processed here.
              </p>
            </div>

            <Button onClick={handleAddFunds} className="w-full" size="lg">
              Continue to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
