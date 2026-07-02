import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Fixing PostgreSQL sequences...')
  const tables = [
    'AdminUser',
    'AdminLoginLog',
    'Project',
    'ProjectQuota',
    'FormField',
    'FormAnswer',
    'Registration',
    'AuditLog',
    'RegistrationLog',
    'ProjectEditLog',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1),
          (SELECT MAX(id) IS NOT NULL FROM "${table}")
        );
      `)
      console.log(`Fixed sequence for table: ${table}`)
    } catch (err: any) {
      console.log(`Skipped or error on ${table}:`, err.message)
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
