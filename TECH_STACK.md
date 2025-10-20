# Neo PlayStation Cafe - Tech Stack

## Overview
A full-stack web application for managing PlayStation cafe operations with room booking, time tracking, digital wallet, and in-room ordering.

## Frontend

### Core Framework
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety and better developer experience

### UI & Styling
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Modern icon library
- **Framer Motion** - Smooth animations

### State Management
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state management and caching

### Real-time Communication
- **Socket.io Client** - Real-time room status updates

### Additional Libraries
- **React Router v6** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **QR Code Scanner** - @yudiel/react-qr-scanner for QR code scanning
- **Stripe Elements** - Payment UI components

## Backend

### Core Framework
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type safety

### Database
- **PostgreSQL 15+** - Primary database
- **Prisma** - Modern ORM with type safety
  - Schema management
  - Type-safe queries
  - Database migrations

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Payment Processing
- **Stripe Node SDK** - Payment processing and wallet management

### Real-time Communication
- **Socket.io** - WebSocket server for real-time updates

### Validation & Utilities
- **Zod** - Runtime schema validation
- **dotenv** - Environment variable management
- **morgan** - HTTP request logger
- **winston** - Application logging

### Background Jobs
- **node-cron** - Scheduled tasks (billing, cleanup)

## Database Schema Design

### Main Tables
1. **users** - Customer accounts
2. **rooms** - PlayStation room details
3. **sessions** - Active gaming sessions
4. **wallets** - Digital wallet per user
5. **transactions** - Wallet transactions
6. **orders** - Food and drink orders
7. **menu_items** - Available food/drinks
8. **payments** - Payment records

## Hardware Integration

### QR Code System
- Generate unique QR codes per room
- QR codes contain encrypted room ID and timestamp
- Validation on scan

### Door Lock System (Future Integration)
- REST API endpoints for door control
- Support for IoT door locks
- Webhook for lock status

### Room Status Lights (Future Integration)
- REST API endpoints for light control
- Real-time status sync

## DevOps & Deployment

### Development
- **Node.js 18+**
- **pnpm** - Fast, efficient package manager
- **Nodemon** - Auto-restart during development
- **Concurrently** - Run frontend and backend together

### Production Ready
- **PM2** - Process manager
- **Docker** - Containerization (optional)
- **Nginx** - Reverse proxy

### Environment Variables
- Stripe API keys
- Database connection
- JWT secrets
- API endpoints

## API Architecture

### RESTful Endpoints
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/rooms` - Room operations
- `/api/sessions` - Session management
- `/api/wallet` - Wallet operations
- `/api/orders` - Order management
- `/api/menu` - Menu items
- `/api/admin` - Admin operations

### WebSocket Events
- `room:status` - Room availability updates
- `session:update` - Session time/billing updates
- `order:status` - Order status changes

## Key Features Implementation

### 1. Room Availability System
- Real-time status updates via WebSocket
- Visual indicators (green/red)
- Automatic status change on session start/end

### 2. QR Code Door Access
- Secure QR code generation
- Time-limited validity
- One-time use tokens
- Door unlock trigger

### 3. Time Tracking & Billing
- Automatic timer start on door open
- Per-minute/hour billing calculation
- Real-time cost display
- Auto-deduct from wallet

### 4. Digital Wallet
- Add funds via Stripe
- Transaction history
- Balance management
- Auto-reload option

### 5. In-Room Ordering
- Browse menu
- Add to cart
- Real-time order status
- Delivery to room

## Security Considerations
- Encrypted passwords (bcrypt)
- JWT tokens with expiration
- Rate limiting on API endpoints
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection
- Secure Stripe integration
- HTTPS only in production

## Performance Optimizations
- Database indexing
- Response caching
- Connection pooling
- Lazy loading components
- Code splitting
- Image optimization
- WebSocket connection management

## Monitoring & Logging
- Winston for structured logging
- Error tracking
- Performance metrics
- User activity logs
- Transaction logs
