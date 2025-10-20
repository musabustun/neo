# Neo PlayStation Cafe - Full Stack Application

A comprehensive web application for managing a PlayStation cafe with private gaming rooms. Customers can book rooms, track their gaming sessions with automatic billing, order food/drinks, and manage their digital wallet.

## 🎮 Features

### Customer Features
- **🔐 Authentication**: Secure registration and login with JWT
- **🎯 Room Booking**: Browse available rooms with real-time status
- **📱 QR Code Access**: Scan QR codes to unlock doors and start sessions
- **⏱️ Auto Time Tracking**: Automatic session timing and cost calculation
- **💰 Digital Wallet**: Stripe-powered wallet for seamless payments
- **🍕 In-Room Ordering**: Order food and drinks to your room
- **📊 Session History**: View past sessions and spending
- **🔔 Real-time Updates**: Live room status and order updates via WebSocket

### Admin Features
- **📈 Dashboard Analytics**: Revenue, active sessions, user stats
- **🏢 Room Management**: Create, update, and manage rooms
- **🍽️ Menu Management**: Add and manage food/drink items
- **📦 Order Management**: Track and update order status
- **👥 User Management**: View and manage customer accounts
- **💳 Transaction Monitoring**: Track all payments and wallet activity

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Socket.io** - Real-time communication
- **Zod** - Validation
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Navigation
- **Socket.io Client** - Real-time updates
- **Stripe Elements** - Payment UI

## 📁 Project Structure

```
neo/
├── backend/                 # Backend API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, error handling
│   │   ├── validators/     # Zod schemas
│   │   ├── utils/          # Helpers
│   │   └── server.ts       # Entry point
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # Utilities & API
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Root component
│   └── package.json
├── TECH_STACK.md          # Detailed tech stack
└── TODO.md                # Development roadmap
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or pnpm
- Stripe account (for payments)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database connection string
- JWT secret
- Stripe API keys
- Other settings

4. **Setup database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

5. **Start development server:**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- API URL
- Stripe publishable key

4. **Start development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🧪 Test Credentials

After running the seed script:

### Customer Account
- Email: `customer@test.com`
- Password: `customer123`
- Wallet Balance: $100

### Admin Account
- Email: `admin@neo.cafe`
- Password: `admin123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms/verify-qr` - Verify QR code
- `GET /api/rooms/:id/qr-image` - Get QR code image

### Sessions
- `POST /api/sessions/start` - Start session
- `POST /api/sessions/:id/end` - End session
- `GET /api/sessions/active` - Get active session
- `GET /api/sessions/history` - Get session history

### Wallet
- `GET /api/wallet` - Get wallet info
- `POST /api/wallet/add-funds` - Add funds
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/create-payment-intent` - Create payment intent

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/active/list` - Get active orders
- `GET /api/orders/:id` - Get order by ID

### Menu
- `GET /api/menu` - Get menu items
- `GET /api/menu/categories` - Get categories
- `GET /api/menu/:id` - Get menu item

### Admin (Requires ADMIN role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/activity` - Recent activity
- `POST /api/admin/rooms` - Create room
- `PUT /api/admin/rooms/:id` - Update room
- `DELETE /api/admin/rooms/:id` - Delete room
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users
- `GET /api/admin/sessions` - Get all sessions

## 🔌 WebSocket Events

### Client Listeners
- `room:status` - Room availability changes
- `session:ended` - Session completion
- `order:new` - New order created
- `order:status` - Order status update
- `room:updated` - Room details updated

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- Secure Stripe integration
- HTTPS in production

## 📦 Database Schema

### Main Tables
- `users` - User accounts
- `wallets` - Digital wallets
- `transactions` - Wallet transactions
- `rooms` - Gaming rooms
- `sessions` - Gaming sessions
- `menu_items` - Food & drink menu
- `orders` - Customer orders
- `order_items` - Order line items
- `payments` - Payment records

## 🎨 Key Features Implementation

### QR Code System
- Unique encrypted QR code per room
- Time-stamped validation
- Automatic door unlock trigger
- Secure signature verification

### Session Management
- Real-time cost calculation
- Automatic timer tracking
- Per-minute billing
- Auto-wallet deduction

### Digital Wallet
- Stripe payment integration
- Transaction history
- Real-time balance updates
- Secure payment processing

### Order System
- Real-time menu browsing
- Shopping cart
- Order status tracking
- Room delivery

## 🚢 Deployment

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Environment Setup
- Configure production database
- Set production environment variables
- Setup SSL/HTTPS
- Configure CORS
- Setup PM2 or Docker
- Configure Nginx reverse proxy

## 📝 Development Roadmap

See [TODO.md](./TODO.md) for detailed development tasks and progress.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Built with ❤️ for Neo PlayStation Cafe

## 🆘 Support

For issues or questions:
1. Check the TODO.md for known issues
2. Review API documentation
3. Check database schema
4. Verify environment variables

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Loyalty program
- [ ] Advance booking system
- [ ] Tournament mode
- [ ] Social features
- [ ] Hardware integration (actual door locks, lights)
- [ ] Dynamic pricing
- [ ] Analytics dashboard
- [ ] AI recommendations

---

**Happy Gaming! 🎮**
