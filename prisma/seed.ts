import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const superAdminEmail = 'superadmin@example.com' // Replace with your actual Google account email

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })
  
  console.log('Seed completed successfully.')
  console.log({ superAdmin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
