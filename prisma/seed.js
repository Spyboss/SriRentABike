const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const bikes = [
    { make: 'Honda', model: 'Dio', plateNo: 'SP-AB-1234', engineNo: 'ENG-001', chassisNo: 'CHS-001', color: 'Red' },
    { make: 'Yamaha', model: 'Fascino', plateNo: 'SP-CD-5678', engineNo: 'ENG-002', chassisNo: 'CHS-002', color: 'Blue' },
    { make: 'Suzuki', model: 'Access', plateNo: 'SP-EF-9012', engineNo: 'ENG-003', chassisNo: 'CHS-003', color: 'Black' }
  ]

  for (const b of bikes) {
    await prisma.bike.upsert({
      where: { plateNo: b.plateNo },
      update: {},
      create: b
    })
  }

  const email = process.env.INIT_ADMIN_EMAIL
  const password = process.env.INIT_ADMIN_PASSWORD
  if (email && password) {
    const argon2 = require('argon2')
    const hash = await argon2.hash(password)
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: hash, role: 'ADMIN', name: 'Owner' }
    })
    console.log('Admin user ensured:', email)
  } else {
    console.log('INIT_ADMIN_EMAIL/INIT_ADMIN_PASSWORD not set; skipping admin seed')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })