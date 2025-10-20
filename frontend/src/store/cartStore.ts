import { create } from 'zustand';
import { CartItem, MenuItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (menuItem, quantity = 1) =>
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.menuItem.id === menuItem.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.menuItem.id === menuItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { menuItem, quantity }],
      };
    }),

  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.menuItem.id !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((item) => item.menuItem.id !== menuItemId)
          : state.items.map((item) =>
              item.menuItem.id === menuItemId ? { ...item, quantity } : item
            ),
    })),

  clearCart: () => set({ items: [] }),

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },
}));
