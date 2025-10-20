// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  wallet?: {
    balance: number;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// Room types
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  description?: string;
  status: RoomStatus;
  pricePerMinute: number;
  consoleType: string;
  capacity: number;
  qrCode: string;
  imageUrl?: string;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

// Session types
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Session {
  id: string;
  userId: string;
  roomId: string;
  status: SessionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  costPerMinute: number;
  totalCost: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  user?: Partial<User>;
  currentDuration?: number;
  currentCost?: number;
}

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

export type TransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'REFUND' 
  | 'SESSION_PAYMENT' 
  | 'ORDER_PAYMENT';

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  stripePaymentId?: string;
  createdAt: string;
}

// Menu types
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
  updatedAt: string;
}

// Order types
export type OrderStatus = 
  | 'PENDING' 
  | 'PREPARING' 
  | 'READY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  priceAtOrder: number;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  userId: string;
  roomId?: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  room?: Partial<Room>;
  user?: Partial<User>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  total?: number;
}

export interface ApiError {
  success: false;
  error: string;
  stack?: string;
}

// Cart types
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// Admin Stats
export interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  activeSessions: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
}
