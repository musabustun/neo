#!/bin/bash

echo "🎮 Neo PlayStation Cafe - Setup Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "${YELLOW}⚠️  Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "${YELLOW}⚠️  PostgreSQL is not installed. Please install PostgreSQL 15+ first.${NC}"
    exit 1
fi

echo "${GREEN}✓ PostgreSQL found${NC}"
echo ""

# Setup Backend
echo "${BLUE}📦 Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠️  Creating .env file from .env.example${NC}"
    cp .env.example .env
    echo "${YELLOW}⚠️  Please edit backend/.env with your configuration before continuing${NC}"
    echo "Press Enter when ready..."
    read
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "${YELLOW}⚠️  Make sure PostgreSQL is running and database is created${NC}"
echo "Running database migrations..."
npm run prisma:migrate

echo "Seeding database with test data..."
npm run prisma:seed

cd ..

# Setup Frontend
echo ""
echo "${BLUE}📦 Setting up Frontend...${NC}"
cd frontend

if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠️  Creating .env file from .env.example${NC}"
    cp .env.example .env
    echo "${YELLOW}⚠️  Please edit frontend/.env with your configuration${NC}"
fi

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "🔑 Test Credentials:"
echo "Customer: customer@test.com / customer123"
echo "Admin: admin@neo.cafe / admin123"
echo ""
echo "Happy Gaming! 🎮"
