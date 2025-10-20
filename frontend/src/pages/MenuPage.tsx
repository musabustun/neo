import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Clock } from 'lucide-react';
import { ApiListResponse, MenuItem } from '@/types';

export default function MenuPage() {
  const { toast } = useToast();
  const { items: cartItems, addItem, updateQuantity, getTotalItems, getTotalAmount } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Fetch menu items
  const { data: menuItems } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<MenuItem>>('/menu');
      return response.data.data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: string[] }>('/menu/categories');
      return ['All', ...response.data.data];
    },
  });

  const filteredItems = menuItems?.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  const getItemQuantity = (menuItemId: string) => {
    const cartItem = cartItems.find((item) => item.menuItem.id === menuItemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    addItem(menuItem);
    toast({
      title: 'Added to cart',
      description: `${menuItem.name} added to your cart`,
    });
  };

  const handleUpdateQuantity = (menuItem: MenuItem, quantity: number) => {
    updateQuantity(menuItem.id, quantity);
    if (quantity === 0) {
      toast({
        title: 'Removed from cart',
        description: `${menuItem.name} removed from your cart`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground mt-1">
            Order food and drinks to your room
          </p>
        </div>
        {getTotalItems() > 0 && (
          <Button size="lg" onClick={() => window.location.href = '/orders'}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Cart ({getTotalItems()})
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories?.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems?.map((item) => {
          const quantity = getItemQuantity(item.id);
          
          return (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{item.category}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(item.price)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {item.preparationTime} min
                  </div>
                </div>

                {quantity === 0 ? (
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.isAvailable}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQuantity(item, quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center font-semibold">
                      {quantity}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQuantity(item, quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cart Summary (Fixed Bottom on Mobile) */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Total ({getTotalItems()} items)</span>
            <span className="text-xl font-bold">{formatCurrency(getTotalAmount())}</span>
          </div>
          <Button className="w-full" onClick={() => window.location.href = '/orders'}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            View Cart & Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
