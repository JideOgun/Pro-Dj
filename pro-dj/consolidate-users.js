const { PrismaClient } = require('./app/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function consolidateUsers() {
  try {
    console.log('🔍 Finding duplicate users...');
    
    // Find all users with the same email (case insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'Jideogun93@gmail.com' },
          { email: 'jideogun93@gmail.com' }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${users.length} users with email: Jideogun93@gmail.com`);
    
    if (users.length <= 1) {
      console.log('✅ No duplicates found');
      return;
    }

    // Keep the first user (oldest) and merge data from others
    const primaryUser = users[0];
    const duplicateUsers = users.slice(1);

    console.log('Primary user:', {
      id: primaryUser.id,
      email: primaryUser.email,
      role: primaryUser.role,
      hasPassword: !!primaryUser.password,
      hasGoogleId: !!primaryUser.googleId
    });

    // Merge data from duplicate users
    for (const duplicate of duplicateUsers) {
      console.log('Merging duplicate user:', {
        id: duplicate.id,
        role: duplicate.role,
        hasPassword: !!duplicate.password,
        hasGoogleId: !!duplicate.googleId
      });

      // Update primary user with missing data
      const updateData = {};
      
      if (!primaryUser.password && duplicate.password) {
        updateData.password = duplicate.password;
        console.log('✅ Added password from duplicate');
      }
      
      if (!primaryUser.googleId && duplicate.googleId) {
        updateData.googleId = duplicate.googleId;
        console.log('✅ Added Google ID from duplicate');
      }
      
      if (!primaryUser.name && duplicate.name) {
        updateData.name = duplicate.name;
        console.log('✅ Added name from duplicate');
      }

      // Ensure admin role is preserved
      if (duplicate.role === 'ADMIN' || primaryUser.role === 'ADMIN') {
        updateData.role = 'ADMIN';
        console.log('✅ Preserved ADMIN role');
      }

      // Update primary user if needed
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: primaryUser.id },
          data: updateData
        });
        console.log('✅ Updated primary user');
      }

      // Delete duplicate user
      await prisma.user.delete({
        where: { id: duplicate.id }
      });
      console.log('✅ Deleted duplicate user');
    }

    // Verify final state
    const finalUser = await prisma.user.findUnique({
      where: { email: 'Jideogun93@gmail.com' }
    });

    console.log('✅ Final consolidated user:', {
      id: finalUser.id,
      email: finalUser.email,
      role: finalUser.role,
      hasPassword: !!finalUser.password,
      hasGoogleId: !!finalUser.googleId,
      name: finalUser.name
    });

    console.log('🎉 User consolidation complete!');

  } catch (error) {
    console.error('❌ Error consolidating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consolidateUsers();
