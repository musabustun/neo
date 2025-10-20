# Neo PlayStation Cafe - Backend API

Backend API for Neo PlayStation Cafe management system.

## Features

- 🔐 JWT Authentication & Authorization
- 🎮 Room Management with QR Code Access
- ⏱️ Automated Session Time Tracking & Billing
- 💰 Digital Wallet with Stripe Integration
- 🍕 In-Room Food & Drink Ordering
- 🔔 Real-time Updates via WebSocket
- 👨‍💼 Admin Dashboard & Management
- 📊 Analytics & Reporting

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **Payment:** Stripe
- **Real-time:** Socket.io
- **Validation:** Zod

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm or pnpm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
- Database connection string
- JWT secret
- Stripe API keys
- Other configuration

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Database Management

- **Prisma Studio** (Database GUI):
```bash
npm run prisma:studio
```

- **Create Migration**:
```bash
npx prisma migrate dev --name your_migration_name
```

- **Reset Database**:
```bash
npx prisma migrate reset
```

## API Documentation

### Authentication

#### Register
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Rooms

#### Get All Rooms
```
GET /api/rooms
```

#### Get Room by ID
```
GET /api/rooms/:id
```

#### Verify QR Code
```
POST /api/rooms/verify-qr
Authorization: Bearer <token>
{
  "qrCode": "base64_encoded_qr_data"
}
```

#### Get QR Code Image
```
GET /api/rooms/:id/qr-image
```

### Sessions

#### Start Session
```
POST /api/sessions/start
Authorization: Bearer <token>
{
  "roomId": "room_uuid"
}
```

#### End Session
```
POST /api/sessions/:id/end
Authorization: Bearer <token>
```

#### Get Active Session
```
GET /api/sessions/active
Authorization: Bearer <token>
```

#### Get Session History
```
GET /api/sessions/history?limit=10&offset=0
Authorization: Bearer <token>
```

### Wallet

#### Get Wallet
```
GET /api/wallet
Authorization: Bearer <token>
```

#### Add Funds
```
POST /api/wallet/add-funds
Authorization: Bearer <token>
{
  "amount": 5000,
  "paymentMethodId": "pm_xxxxx"
}
```

#### Get Transactions
```
GET /api/wallet/transactions?limit=20&offset=0
Authorization: Bearer <token>
```

#### Create Payment Intent
```
POST /api/wallet/create-payment-intent
Authorization: Bearer <token>
{
  "amount": 5000
}
```

### Orders

#### Create Order
```
POST /api/orders
Authorization: Bearer <token>
{
  "roomId": "room_uuid",
  "items": [
    {
      "menuItemId": "item_uuid",
      "quantity": 2
    }
  ],
  "notes": "Extra ketchup please"
}
```

#### Get Orders
```
GET /api/orders?status=PENDING&limit=10&offset=0
Authorization: Bearer <token>
```

#### Get Active Orders
```
GET /api/orders/active/list
Authorization: Bearer <token>
```

#### Get Order by ID
```
GET /api/orders/:id
Authorization: Bearer <token>
```

### Menu

#### Get Menu Items
```
GET /api/menu?category=Drinks&isAvailable=true
```

#### Get Menu Item
```
GET /api/menu/:id
```

#### Get Categories
```
GET /api/menu/categories
```

### Admin

All admin routes require `ADMIN` role.

#### Get Statistics
```
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

#### Get Recent Activity
```
GET /api/admin/activity
Authorization: Bearer <admin_token>
```

#### Create Room
```
POST /api/admin/rooms
Authorization: Bearer <admin_token>
{
  "roomNumber": "R007",
  "name": "VIP Suite",
  "description": "Premium room",
  "pricePerMinute": 100,
  "consoleType": "PlayStation 5",
  "capacity": 4,
  "amenities": ["4K TV", "AC"]
}
```

#### Update Room
```
PUT /api/admin/rooms/:id
Authorization: Bearer <admin_token>
{
  "status": "MAINTENANCE"
}
```

#### Delete Room
```
DELETE /api/admin/rooms/:id
Authorization: Bearer <admin_token>
```

#### Create Menu Item
```
POST /api/admin/menu
Authorization: Bearer <admin_token>
{
  "name": "New Item",
  "description": "Description",
  "price": 500,
  "category": "Snacks",
  "preparationTime": 5
}
```

#### Update Menu Item
```
PUT /api/admin/menu/:id
Authorization: Bearer <admin_token>
{
  "isAvailable": false
}
```

#### Get All Orders
```
GET /api/admin/orders?status=PENDING&limit=20&offset=0
Authorization: Bearer <admin_token>
```

#### Update Order Status
```
PUT /api/admin/orders/:id/status
Authorization: Bearer <admin_token>
{
  "status": "PREPARING"
}
```

#### Get All Users
```
GET /api/admin/users?limit=20&offset=0&search=john
Authorization: Bearer <admin_token>
```

#### Get All Sessions
```
GET /api/admin/sessions?status=ACTIVE&limit=20&offset=0
Authorization: Bearer <admin_token>
```

## WebSocket Events

### Client -> Server
```javascript
socket.emit('join', { userId, roomId });
```

### Server -> Client
```javascript
// Room status update
socket.on('room:status', (data) => {
  // { roomId, status, sessionId }
});

// Session ended
socket.on('session:ended', (data) => {
  // { sessionId, userId, totalCost, duration }
});

// New order
socket.on('order:new', (data) => {
  // { orderId, userId, roomId, totalAmount }
});

// Order status update
socket.on('order:status', (data) => {
  // { orderId, userId, status }
});

// Room updated
socket.on('room:updated', (data) => {
  // { updated room object }
});
```

## Test Credentials

After running the seed script:

- **Admin:** admin@neo.cafe / admin123
- **Customer:** customer@test.com / customer123 (with $100 balance)

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── controllers/       # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── validators/       # Zod schemas
│   ├── utils/           # Helper functions
│   └── server.ts        # Entry point
├── .env.example         # Environment variables template
├── package.json
└── tsconfig.json
```

## Production Deployment

1. Build the TypeScript code:
```bash
npm run build
```

2. Set environment variables for production

3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Start the server:
```bash
npm start
```

Or use PM2:
```bash
pm2 start dist/server.js --name neo-cafe-api
```

## License

MIT
