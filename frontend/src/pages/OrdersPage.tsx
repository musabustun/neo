import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useSessionStore } from '@/store/sessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { ApiListResponse, Order, ApiResponse } from '@/types';

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items: cartItems, updateQuantity, clearCart, getTotalAmount, getTotalItems } = useCartStore();
  const { activeSession } = useSessionStore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch orders
  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<Order>>('/orders?limit=20');
      return response.data.data;
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        roomId: activeSession?.roomId,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      };
      const response = await api.post<ApiResponse<Order>>('/orders', orderData);
      return response.data;
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Order Placed!',
        description: 'Your order is being prepared',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to place order',
        description: error.response?.data?.error || 'Please try again',
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setIsPlacingOrder(true);
    await placeOrderMutation.mutateAsync();
    setIsPlacingOrder(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      PREPARING: { variant: 'default', label: 'Preparing' },
      READY: { variant: 'default', label: 'Ready' },
      DELIVERED: { variant: 'secondary', label: 'Delivered' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage your cart and view order history
        </p>
      </div>

      {/* Cart */}
      {cartItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart ({getTotalItems()} items)
            </CardTitle>
            <CardDescription>
              {activeSession
                ? `Order will be delivered to ${activeSession.room?.name}`
                : 'Order for pickup'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg"
                >
                  <img
                    src={item.menuItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                    alt={item.menuItem.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.menuItem.price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right font-semibold">
                    {formatCurrency(item.menuItem.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-2xl text-primary">
                  {formatCurrency(getTotalAmount())}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => clearCart()}
                className="flex-1"
              >
                Clear Cart
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="flex-1"
                size="lg"
              >
                {isPlacingOrder && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Place Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View your past orders</CardDescription>
        </CardHeader>
        <CardContent>
          {!ordersData || ordersData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No orders yet
            </p>
          ) : (
            <div className="space-y-4">
              {ordersData.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Order #{order.id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {formatDateTime(order.createdAt)}
                          {order.room && ` • ${order.room.name}`}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.menuItem?.name || 'Item'}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(item.priceAtOrder * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex items-center justify-between font-bold">
                      <span>Total</span>
                      <span className="text-lg text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
