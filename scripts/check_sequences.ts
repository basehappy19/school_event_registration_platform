import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkTable(table: string) {
  try {
    const maxResult: any[] = await prisma.$queryRawUnsafe(`SELECT MAX(id) as max_id FROM "${table}";`)
    const seqNameResult: any[] = await prisma.$queryRawUnsafe(`SELECT pg_get_serial_sequence('"${table}"', 'id') as seq_name;`)
    const seqName = seqNameResult[0]?.seq_name
    let nextVal = null
    if (seqName) {
      const nextValResult: any[] = await prisma.$queryRawUnsafe(`SELECT last_value FROM ${seqName};`)
      nextVal = nextValResult[0]?.last_value
    }
    console.log(`Table: ${table} | MAX(id): ${maxResult[0]?.max_id} | Sequence last_value: ${nextVal}`)
    
    if (maxResult[0]?.max_id && nextVal && BigInt(maxResult[0]?.max_id) >= BigInt(nextVal)) {
      console.log(`  -> FIXING ${table}...`)
      await prisma.$executeRawUnsafe(`SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM "${table}"), 1) + 1, false);`)
      console.log(`  -> FIXED ${table}`)
    }
  } catch (err: any) {
    console.log(`Error checking ${table}: ${err.message}`)
  }
}

async function main() {
  console.log('Checking sequences...')
  await checkTable('Registration')
  await checkTable('FormAnswer')
  await checkTable('AuditLog')
  await checkTable('RegistrationLog')
  await checkTable('Project')
  await checkTable('ProjectQuota')
  await checkTable('FormField')
  
  await prisma.$disconnect()
}

main().catch(console.error)
