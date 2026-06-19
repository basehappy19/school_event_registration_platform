import 'dotenv/config'
import { PrismaClient, AdminRole, FieldType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. Create Admin
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  })
  console.log('Created Admin:', admin.email)

  // 2. Create Project
  const project = await prisma.project.create({
    data: {
      title: 'Summer Science Camp 2026',
      description: 'A dedicated science camp for Grades 10-12.',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isPublished: true,
      quotas: {
        create: [
          { grade: '10', capacity: 30 },
          { grade: '11', capacity: 30 },
          { grade: '12', capacity: 20 },
        ]
      },
      formFields: {
        create: [
          {
            label: 'T-Shirt Size',
            type: FieldType.DROPDOWN,
            options: JSON.stringify(['S', 'M', 'L', 'XL']),
            isRequired: true
          },
          {
            label: 'Dietary Restrictions',
            type: FieldType.SHORT_TEXT,
            isRequired: false
          }
        ]
      }
    }
  })
  console.log('Created Project:', project.title)

  // 3. Create Mock Student Profiles
  const grades = ['10', '11', '12']
  let studentCount = 0

  for (let i = 1; i <= 20; i++) {
    const grade = grades[i % 3]
    const studentId = `660${i.toString().padStart(2, '0')}`
    const nationalId = `11001123456${i.toString().padStart(2, '0')}` // Last 5 digits: 345601, etc.
    
    await prisma.studentProfile.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        nationalId,
        prefix: i % 2 === 0 ? 'Mr.' : 'Ms.',
        firstName: `Student${i}`,
        lastName: `Testable`,
        grade,
        room: (i % 5 + 1).toString(),
        number: i.toString()
      }
    })
    studentCount++
  }
  
  console.log(`Created ${studentCount} Student Profiles.`)
  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
