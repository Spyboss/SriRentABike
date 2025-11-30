const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to Prisma...');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✅ Connected! Result:', result);
  } catch (e) {
    console.error('❌ Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
