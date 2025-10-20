import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate QR code
const generateRoomQRCode = (roomId: string): string => {
  const timestamp = Date.now();
  const secret = process.env.QR_CODE_SECRET || 'default-secret';
  const payload = JSON.stringify({ roomId, timestamp });
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@neo.cafe' },
    update: {},
    create: {
      email: 'admin@neo.cafe',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Neo',
      role: 'ADMIN',
      phone: '+1234567890',
    },
  });

  // Create admin wallet
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 0,
    },
  });

  console.log('✅ Admin user created: admin@neo.cafe / admin123');

  // Create test customer
  console.log('👤 Creating test customer...');
  const customerPassword = await bcrypt.hash('customer123', 10);
  
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      phone: '+1987654321',
    },
  });

  // Create customer wallet with initial balance
  await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      balance: 10000, // $100
    },
  });

  console.log('✅ Test customer created: customer@test.com / customer123');

  // Create rooms
  console.log('🎮 Creating rooms...');
  const roomsData = [
    {
      roomNumber: 'R001',
      name: 'VIP Suite PS5',
      description: 'Premium room with PS5, 65" 4K OLED TV, and premium sound system',
      pricePerMinute: 100, // $1 per minute
      consoleType: 'PlayStation 5',
      capacity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3',
      amenities: ['4K OLED TV', '7.1 Surround Sound', 'Recliner Chairs', 'AC', 'Mini Fridge'],
    },
    {
      roomNumber: 'R002',
      name: 'Standard PS5',
      description: 'Comfortable room with PS5 and 55" 4K TV',
      pricePerMinute: 75, // $0.75 per minute
      consoleType: 'PlayStation 5',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8',
      amenities: ['4K TV', 'Stereo Sound', 'Comfortable Chairs', 'AC'],
    },
    {
      roomNumber: 'R003',
      name: 'Standard PS5',
      description: 'Comfortable room with PS5 and 55" 4K TV',
      pricePerMinute: 75,
      consoleType: 'PlayStation 5',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1511882150382-421056c89033',
      amenities: ['4K TV', 'Stereo Sound', 'Comfortable Chairs', 'AC'],
    },
    {
      roomNumber: 'R004',
      name: 'PS4 Pro Room',
      description: 'Budget-friendly room with PS4 Pro',
      pricePerMinute: 50, // $0.50 per minute
      consoleType: 'PlayStation 4 Pro',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6',
      amenities: ['Full HD TV', 'Basic Sound', 'AC'],
    },
    {
      roomNumber: 'R005',
      name: 'Party Room PS5',
      description: 'Large room for groups with PS5 and 75" TV',
      pricePerMinute: 150, // $1.50 per minute
      consoleType: 'PlayStation 5',
      capacity: 6,
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
      amenities: ['75" 4K TV', '9.1 Surround Sound', 'Gaming Chairs', 'AC', 'Snack Bar'],
    },
    {
      roomNumber: 'R006',
      name: 'Standard PS5',
      description: 'Comfortable room with PS5 and 55" 4K TV',
      pricePerMinute: 75,
      consoleType: 'PlayStation 5',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
      amenities: ['4K TV', 'Stereo Sound', 'Comfortable Chairs', 'AC'],
    },
  ];

  for (const roomData of roomsData) {
    const room = await prisma.room.upsert({
      where: { roomNumber: roomData.roomNumber },
      update: {},
      create: {
        ...roomData,
        qrCode: 'temp', // temporary
        status: 'AVAILABLE',
      },
    });

    // Update with actual QR code
    const qrCode = generateRoomQRCode(room.id);
    await prisma.room.update({
      where: { id: room.id },
      data: { qrCode },
    });
  }

  console.log('✅ Rooms created');

  // Create menu items
  console.log('🍕 Creating menu items...');
  const menuItems = [
    // Drinks
    {
      name: 'Coca Cola',
      description: 'Classic Coca Cola',
      price: 250,
      category: 'Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7',
      isAvailable: true,
      preparationTime: 2,
    },
    {
      name: 'Pepsi',
      description: 'Refreshing Pepsi',
      price: 250,
      category: 'Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e',
      isAvailable: true,
      preparationTime: 2,
    },
    {
      name: 'Red Bull',
      description: 'Energy drink',
      price: 450,
      category: 'Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34f3a24e',
      isAvailable: true,
      preparationTime: 2,
    },
    {
      name: 'Water',
      description: 'Bottled water',
      price: 150,
      category: 'Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
      isAvailable: true,
      preparationTime: 1,
    },
    {
      name: 'Coffee',
      description: 'Fresh brewed coffee',
      price: 350,
      category: 'Hot Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
      isAvailable: true,
      preparationTime: 5,
    },
    {
      name: 'Hot Chocolate',
      description: 'Rich hot chocolate',
      price: 400,
      category: 'Hot Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7',
      isAvailable: true,
      preparationTime: 5,
    },
    // Snacks
    {
      name: 'Chips',
      description: 'Crispy potato chips',
      price: 300,
      category: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b',
      isAvailable: true,
      preparationTime: 1,
    },
    {
      name: 'Popcorn',
      description: 'Buttery popcorn',
      price: 350,
      category: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f',
      isAvailable: true,
      preparationTime: 3,
    },
    {
      name: 'Nachos',
      description: 'Nachos with cheese dip',
      price: 600,
      category: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d',
      isAvailable: true,
      preparationTime: 5,
    },
    {
      name: 'French Fries',
      description: 'Crispy french fries',
      price: 400,
      category: 'Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
      isAvailable: true,
      preparationTime: 7,
    },
    // Meals
    {
      name: 'Cheeseburger',
      description: 'Classic cheeseburger with fries',
      price: 1200,
      category: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      isAvailable: true,
      preparationTime: 15,
    },
    {
      name: 'Pizza',
      description: 'Personal size pizza (8")',
      price: 1500,
      category: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
      isAvailable: true,
      preparationTime: 20,
    },
    {
      name: 'Chicken Wings',
      description: '8 pieces with sauce',
      price: 1000,
      category: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f',
      isAvailable: true,
      preparationTime: 15,
    },
    {
      name: 'Sandwich',
      description: 'Club sandwich with fries',
      price: 900,
      category: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
      isAvailable: true,
      preparationTime: 10,
    },
    // Desserts
    {
      name: 'Ice Cream',
      description: 'Two scoops of ice cream',
      price: 500,
      category: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
      isAvailable: true,
      preparationTime: 3,
    },
    {
      name: 'Brownie',
      description: 'Chocolate brownie with ice cream',
      price: 600,
      category: 'Desserts',
      imageUrl: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023',
      isAvailable: true,
      preparationTime: 5,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log('✅ Menu items created');

  console.log('🎉 Database seed completed!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@neo.cafe / admin123');
  console.log('Customer: customer@test.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
