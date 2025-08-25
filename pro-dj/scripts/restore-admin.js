const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAdmin() {
  try {
    console.log('🔧 Restoring admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'jideogun93@gmail.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('your-admin-password', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'jideogun93@gmail.com',
        name: 'Babajide Ogunbanjo',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        termsVersion: '1.0',
        privacyVersion: '1.0',
      },
    });

    console.log('✅ Admin user created:', admin.email);

    // Create admin DJ profile
    const djProfile = await prisma.djProfile.create({
      data: {
        userId: admin.id,
        stageName: 'JAY BABA',
        genres: ['Afrobeats', 'Hip Hop', 'Pop', 'R&B'],
        bio: 'Professional DJ and founder of Pro-DJ platform. Specializing in Afrobeats, Hip Hop, and contemporary hits. Creating unforgettable experiences for all types of events.',
        experience: 8,
        location: 'New York, NY',
        travelRadius: 100,
        eventsOffered: ['Wedding', 'Club', 'Corporate', 'Birthday', 'Private Party'],
        isApprovedByAdmin: true,
        isAcceptingBookings: true,
        isFeatured: true,
        rating: 4.9,
        totalBookings: 150,
      },
    });

    console.log('✅ Admin DJ profile created:', djProfile.stageName);

    // Grant subscription to admin DJ
    const adminExpirationDate = new Date();
    adminExpirationDate.setFullYear(adminExpirationDate.getFullYear() + 1);

    await prisma.subscription.create({
      data: {
        userId: admin.id,
        planType: 'DJ_BASIC',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: adminExpirationDate,
        amountCents: 0, // Free for admin
        currency: 'usd',
        isInTrial: false,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `admin_restored_${admin.id}_${Date.now()}`,
        stripeCustomerId: `admin_restored_customer_${admin.id}`,
        stripePriceId: process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, '') || 'admin_restored_price',
      },
    });

    console.log('✅ Admin subscription granted');
    console.log('🎉 Admin restoration completed successfully!');
    console.log('📧 Email: jideogun93@gmail.com');
    console.log('🔑 Password: your-admin-password (change this immediately!)');

  } catch (error) {
    console.error('❌ Error restoring admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdmin();
