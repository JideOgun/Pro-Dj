const { PrismaClient } = require('./app/generated/prisma/index.js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding admin user from .env credentials...');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    
    if (!adminEmail || !adminPassword) {
      console.log('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env file');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('ADMIN')));
      return;
    }
    
    console.log('📧 Admin email from env:', adminEmail);
    console.log('👤 Admin name from env:', adminName);
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Status:', existingAdmin.status);
      console.log('   ID:', existingAdmin.id);
      return;
    }
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user
    console.log('👑 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   ID:', admin.id);
    console.log('   Created:', admin.createdAt);
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminUser();
