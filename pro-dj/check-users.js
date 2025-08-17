const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${users.length} total users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: "${user.email}"`);
      console.log(`   Name: "${user.name}"`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${!!user.password}`);
      console.log(`   Has Google ID: ${!!user.googleId}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
