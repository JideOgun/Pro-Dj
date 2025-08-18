const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function fixLocalUrls() {
  try {
    console.log('Starting to fix localUrl formats...');
    
    // Find all mixes with the old key format
    const mixesWithOldFormat = await prisma.djMix.findMany({
      where: {
        localUrl: {
          contains: 'stream?key='
        }
      },
      select: {
        id: true,
        localUrl: true
      }
    });
    
    console.log(`Found ${mixesWithOldFormat.length} mixes with old localUrl format`);
    
    // Update each mix to use the new id format
    for (const mix of mixesWithOldFormat) {
      const newLocalUrl = `/api/mixes/stream?id=${mix.id}`;
      
      await prisma.djMix.update({
        where: { id: mix.id },
        data: { localUrl: newLocalUrl }
      });
      
      console.log(`Updated mix ${mix.id}: ${mix.localUrl} -> ${newLocalUrl}`);
    }
    
    console.log('All localUrl formats have been fixed!');
    
  } catch (error) {
    console.error('Error fixing localUrl formats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLocalUrls();
