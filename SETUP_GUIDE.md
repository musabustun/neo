# Neo PlayStation Cafe - Setup Guide

## Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **PostgreSQL** 15 or higher
- **npm** or **pnpm**
- **Stripe** account (optional for development)

### Automated Setup (Linux/Mac)

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/neo_cafe?schema=public"

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Stripe (optional for development)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Session Pricing (in cents per minute)
SESSION_PRICE_PER_MINUTE=50

# QR Code Secret
QR_CODE_SECRET=your-qr-secret
```

```bash
# Create PostgreSQL database
createdb neo_cafe

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will run on http://localhost:5000

#### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

```bash
# Start frontend server
npm run dev
```

Frontend will run on http://localhost:5173

### 3. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Prisma Studio:** Run `npm run prisma:studio` in backend directory

### Test Credentials

After seeding:

**Customer Account:**
- Email: customer@test.com
- Password: customer123
- Wallet: $100.00

**Admin Account:**
- Email: admin@neo.cafe
- Password: admin123

## Development Workflow

### Starting Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Database Management

**View Database (Prisma Studio):**
```bash
cd backend
npm run prisma:studio
```

**Create Migration:**
```bash
cd backend
npx prisma migrate dev --name migration_name
```

**Reset Database:**
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Testing the Features

1. **Register/Login**
   - Go to http://localhost:5173
   - Register a new account or use test credentials

2. **Browse Rooms**
   - Navigate to "Rooms"
   - View available gaming rooms

3. **QR Code Scanning**
   - Click "Scan QR Code" button
   - Note: In development, you'll need to generate QR codes via API

4. **Wallet Management**
   - Navigate to "Wallet"
   - View balance and transactions
   - Note: Stripe integration requires valid API keys

5. **Order Food/Drinks**
   - Navigate to "Menu"
   - Add items to cart
   - Place order

6. **Admin Panel** (Use admin credentials)
   - Navigate to admin dashboard
   - View statistics and manage system

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (Mac with Homebrew)
brew services start postgresql
```

### Port Already in Use

If ports 5000 or 5173 are in use:

**Backend:** Edit `backend/.env` and change PORT
**Frontend:** Edit `frontend/vite.config.ts` and change server port

### Prisma Issues

```bash
# Regenerate Prisma client
cd backend
npm run prisma:generate

# Reset and reseed
npm run prisma:migrate reset
npm run prisma:seed
```

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Backend

```bash
cd backend

# Install production dependencies
npm install --production

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/server.js --name neo-cafe-api
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Preview build
npm run preview

# Deploy dist/ folder to hosting service (Vercel, Netlify, etc.)
```

### Environment Variables

Ensure all production environment variables are set:
- Use strong JWT secrets
- Use production Stripe keys
- Use HTTPS URLs
- Set secure CORS origins
- Use production database

## API Documentation

Full API documentation available in `backend/README.md`

Quick API test:
```bash
# Health check
curl http://localhost:5000/health

# Get rooms
curl http://localhost:5000/api/rooms
```

## Support

For issues:
1. Check this guide
2. Review `TODO.md` for known issues
3. Check logs in `backend/logs/`
4. Review Prisma schema in `backend/prisma/schema.prisma`

## Next Steps

- Review `TODO.md` for development roadmap
- Check `TECH_STACK.md` for technical details
- Explore the code structure
- Start building additional features

Happy coding! 🚀
