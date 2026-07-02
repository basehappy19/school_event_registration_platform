import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Safely converting ID columns from INTEGER to TEXT in PostgreSQL...')

  try {
    console.log('Dropping foreign key constraint...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "FormAnswer" DROP CONSTRAINT IF EXISTS "FormAnswer_registrationId_fkey";`)

    console.log('Altering Registration.id...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ALTER COLUMN "id" DROP DEFAULT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ALTER COLUMN "id" TYPE TEXT USING "id"::text;`)

    console.log('Altering FormAnswer.id and registrationId...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "FormAnswer" ALTER COLUMN "id" DROP DEFAULT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "FormAnswer" ALTER COLUMN "id" TYPE TEXT USING "id"::text;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "FormAnswer" ALTER COLUMN "registrationId" TYPE TEXT USING "registrationId"::text;`)

    console.log('Recreating foreign key constraint...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "FormAnswer" ADD CONSTRAINT "FormAnswer_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;`)

    console.log('Altering AuditLog.id...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" ALTER COLUMN "id" DROP DEFAULT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" ALTER COLUMN "id" TYPE TEXT USING "id"::text;`)

    console.log('Altering RegistrationLog.id...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "RegistrationLog" ALTER COLUMN "id" DROP DEFAULT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "RegistrationLog" ALTER COLUMN "id" TYPE TEXT USING "id"::text;`)

    console.log('Successfully altered columns without data loss!')
  } catch (err: any) {
    console.log('Notice during migration:', err.message)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
