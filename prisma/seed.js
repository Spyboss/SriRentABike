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
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })