"use server"

import prisma from "@/lib/prisma"
import { promoteEligibleWaitlist } from "@/lib/quota"
import { headers } from "next/headers"
import { revalidateTag, revalidatePath } from "next/cache"
import { getClientIp } from "@/lib/ip"
import { submitRegistrationSchema } from "@/lib/validations"

import { auth } from "@/auth"

export async function submitRegistration(data: {
  projectId: number,
  formAnswers: { fieldId: number, value: string }[]
}) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const userAgent = headersList.get('user-agent') || 'Unknown'

  const session = await auth()
  if (!session?.user?.email) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนทำการลงทะเบียน' }
  }

  // Validate Student via Google Email
  const student = await prisma.studentProfile.findUnique({
    where: { email: session.user.email }
  })

  if (!student) {
    return { error: 'อีเมลของคุณยังไม่ได้รับการลงทะเบียนเป็นนักเรียนในระบบ' }
  }

  const parsed = submitRegistrationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง หรือมีตัวอักษรยาวเกินไป' }
  }
  const validData = parsed.data


  try {

    const result = await prisma.$transaction(async (tx) => {
      // Lock Project row to serialize capacity calculations safely across parallel transactions
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${validData.projectId} FOR UPDATE`

      // a. Check if already registered for this project
      const existing = await tx.registration.findFirst({
        where: { projectId: validData.projectId, studentId: student.studentId }
      })

      if (existing && existing.status !== 'CANCELLED') {
        throw new Error("Student is already registered for this project")
      }

      // b. Check and lock all Project Quotas for the project to prevent race conditions across grades
      const allQuotas: any[] = await tx.$queryRaw`
        SELECT * FROM "ProjectQuota" 
        WHERE "projectId" = ${validData.projectId}
        FOR UPDATE
      `

      const quota = allQuotas.find(q => q.grade === student.grade)

      if (!quota) {
        throw new Error(`ระดับชั้น ม.${student.grade} ไม่สามารถลงทะเบียนกิจกรรมนี้ได้`)
      }

      const totalProjectCapacity = allQuotas.reduce((sum, q) => sum + Number(q.capacity || 0), 0)

      // c. Count current APPROVED registrations for this grade and across all grades in the project
      const approvedGradeCount = await tx.registration.count({
        where: { projectId: validData.projectId, studentProfile: { grade: student.grade }, status: 'APPROVED' }
      })

      const approvedTotalCount = await tx.registration.count({
        where: { projectId: validData.projectId, status: 'APPROVED' }
      })

      const status: 'APPROVED' | 'WAITLISTED' = (approvedGradeCount < quota.capacity && approvedTotalCount < totalProjectCapacity)
        ? 'APPROVED'
        : 'WAITLISTED'

      // d. Create or Update Registration
      let registration;
      if (existing) {
        // Clear old answers
        await tx.formAnswer.deleteMany({ where: { registrationId: existing.id } })
        
        registration = await tx.registration.update({
          where: { id: existing.id },
          data: {
            status: status,
            createdAt: new Date(), // Reset timestamp for new queue position
            answers: {
              create: validData.formAnswers.map(ans => ({
                fieldId: ans.fieldId,
                value: ans.value
              }))
            }
          }
        })
      } else {
        registration = await tx.registration.create({
          data: {
            projectId: validData.projectId,
            studentId: student.studentId,
            status: status,
            answers: {
              create: validData.formAnswers.map(ans => ({
                fieldId: ans.fieldId,
                value: ans.value
              }))
            }
          }
        })
      }

      // e. Create Audit Log and Registration Log
      await tx.auditLog.create({
        data: {
          action: "SUBMIT_REGISTRATION",
          studentId: student.studentId,
          projectId: data.projectId,
          ipAddress: ip,
          userAgent: userAgent,
          payload: JSON.stringify({ formAnswers: validData.formAnswers, status })
        }
      })

      const proj = await tx.project.findUnique({ where: { id: validData.projectId }, select: { title: true } })
      await tx.registrationLog.create({
        data: {
          action: "REGISTER",
          projectId: validData.projectId,
          projectTitle: proj?.title || "",
          studentId: student.studentId,
          studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
          gradeRoom: `ม.${student.grade}/${student.room}`,
          newStatus: status,
          performedBy: `STUDENT:${student.studentId}`,
          ipAddress: ip,
          userAgent: userAgent,
          details: JSON.stringify({ formAnswers: validData.formAnswers })
        }
      })

      return registration
    })

    revalidateTag('announcements', 'default')
    revalidatePath('/')
    revalidatePath(`/detail/${validData.projectId}`)
    return { success: true, status: result.status, registrationId: result.id }

  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cancelRegistration(registrationId: string) {
  const session = await auth()
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const userAgent = headersList.get('user-agent') || 'Unknown'

  const role = (session?.user as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  if (!session?.user?.email) {
    return { error: 'Unauthorized' }
  }

  try {
    let studentId = ""
    if (!isAdmin) {
      const profile = await prisma.studentProfile.findUnique({
        where: { email: session.user.email }
      })
      if (!profile) {
        return { error: 'Student profile not found' }
      }
      studentId = profile.studentId
    }

    const result = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { studentProfile: true }
      })

      if (!reg || reg.status === 'CANCELLED') {
        throw new Error("Registration not found or already cancelled")
      }

      // Lock the quota for this grade to prevent race conditions during waitlist promotion
      await tx.$queryRaw`
        SELECT * FROM "ProjectQuota" 
        WHERE "projectId" = ${reg.projectId} AND "grade" = ${reg.studentProfile.grade} 
        FOR UPDATE
      `

      // Verify ownership
      if (!isAdmin && reg.studentId !== studentId) {
        throw new Error("Unauthorized to cancel this registration")
      }

      // 2. Delete Registration Completely
      await tx.registration.delete({
        where: { id: registrationId }
      })

      // Create Audit Log and Registration Log for Cancellation
      await tx.auditLog.create({
        data: {
          action: "CANCEL_REGISTRATION",
          projectId: reg.projectId,
          studentId: reg.studentId,
          ipAddress: ip,
          userAgent: userAgent,
          payload: JSON.stringify({ registrationId })
        }
      })

      const cancelProj = await tx.project.findUnique({ where: { id: reg.projectId }, select: { title: true } })
      await tx.registrationLog.create({
        data: {
          action: "CANCEL",
          projectId: reg.projectId,
          projectTitle: cancelProj?.title || "",
          studentId: reg.studentId,
          studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          previousStatus: reg.status,
          newStatus: "CANCELLED",
          performedBy: `STUDENT:${reg.studentId}`,
          ipAddress: ip,
          userAgent: userAgent,
          details: JSON.stringify({ registrationId })
        }
      })

      // 3. Auto-Replacement: If it was APPROVED, we need to promote eligible waitlisted students
      if (reg.status === 'APPROVED') {
        await promoteEligibleWaitlist(tx, reg.projectId)
      }

      return { success: true, projectId: reg.projectId }
    })

    revalidateTag('announcements', 'default')
    revalidatePath('/')
    if (result.projectId) {
      revalidatePath(`/detail/${result.projectId}`)
    }
    return result

  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function approveAllWaitlist(projectId: number) {
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const userAgent = headersList.get('user-agent') || 'Unknown'

  try {
    const result = await prisma.$transaction(async (tx) => {
      const waitlisted = await tx.registration.findMany({
        where: { projectId, status: 'WAITLISTED' }
      })

      if (waitlisted.length === 0) {
        return { success: true, count: 0 }
      }

      await tx.registration.updateMany({
        where: { projectId, status: 'WAITLISTED' },
        data: { status: 'APPROVED' }
      })

      await tx.auditLog.create({
        data: {
          action: "APPROVE_ALL_WAITLIST",
          projectId,
          studentId: "ALL",
          ipAddress: ip,
          userAgent: userAgent,
          payload: JSON.stringify({ count: waitlisted.length })
        }
      })

      return { success: true, count: waitlisted.length }
    })

    revalidateTag('announcements', 'default')
    return result

  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

