"use server"

import prisma from "@/lib/prisma"
import { headers } from "next/headers"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
})

import { auth } from "@/auth"

export async function submitRegistration(data: {
  projectId: number,
  formAnswers: { fieldId: number, value: string }[]
}) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'Unknown'

  const session = await auth()
  if (!session?.user?.email) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนทำการสมัคร' }
  }

  // Validate Student via Google Email
  const student = await prisma.studentProfile.findUnique({
    where: { email: session.user.email }
  })

  if (!student) {
    return { error: 'อีเมลของคุณยังไม่ได้รับการลงทะเบียนเป็นนักเรียนในระบบ' }
  }

  // Handle Registration in Transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // a. Check if already registered for this project
      const existing = await tx.registration.findFirst({
        where: { projectId: data.projectId, studentId: student.studentId }
      })

      if (existing && existing.status !== 'CANCELLED') {
        throw new Error("Student is already registered for this project")
      }

      // b. Check Project Quota for student's grade
      const quota = await tx.projectQuota.findUnique({
        where: { 
          projectId_grade: { 
            projectId: data.projectId, 
            grade: student.grade 
          } 
        }
      })

      if (!quota) {
        throw new Error(`ระดับชั้น ม.${student.grade} ไม่สามารถสมัครกิจกรรมนี้ได้`)
      }

      // c. Count current APPROVED registrations for this grade
      const approvedCount = await tx.registration.count({
        where: { projectId: data.projectId, studentProfile: { grade: student.grade }, status: 'APPROVED' }
      })

      const status = approvedCount < quota.capacity ? 'APPROVED' : 'WAITLISTED'

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
              create: data.formAnswers.map(ans => ({
                fieldId: ans.fieldId,
                value: ans.value
              }))
            }
          }
        })
      } else {
        registration = await tx.registration.create({
          data: {
            projectId: data.projectId,
            studentId: student.studentId,
            status: status,
            answers: {
              create: data.formAnswers.map(ans => ({
                fieldId: ans.fieldId,
                value: ans.value
              }))
            }
          }
        })
      }

      // e. Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "SUBMIT_REGISTRATION",
          studentId: student.studentId,
          projectId: data.projectId,
          ipAddress: ip,
          userAgent: userAgent,
          payload: JSON.stringify({ formAnswers: data.formAnswers, status })
        }
      })

      return registration
    })

    return { success: true, status: result.status, registrationId: result.id }

  } catch (error: any) {
    return { error: error.message || 'Registration failed' }
  }
}

export async function cancelRegistration(registrationId: number) {
  const session = await auth()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'Unknown'

  if (!session?.user?.email) {
    return { error: 'Unauthorized' }
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { email: session.user.email }
    })

    if (!profile) {
      return { error: 'Student profile not found' }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the registration to cancel
      const reg = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { studentProfile: true }
      })

      if (!reg || reg.status === 'CANCELLED') {
        throw new Error("Registration not found or already cancelled")
      }

      // Verify ownership
      if (reg.studentId !== profile.studentId) {
        throw new Error("Unauthorized to cancel this registration")
      }

      // 2. Mark as Cancelled
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' }
      })

      // Create Audit Log for Cancellation
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

      // 3. Auto-Replacement: If it was APPROVED, we need to promote a WAITLISTED student
      if (reg.status === 'APPROVED') {
        // Find the first WAITLISTED student in the same project and grade
        const nextInLine = await tx.registration.findFirst({
          where: { projectId: reg.projectId, studentProfile: { grade: reg.studentProfile.grade }, status: 'WAITLISTED' },
          orderBy: { createdAt: 'asc' }
        })

        if (nextInLine) {
          await tx.registration.update({
            where: { id: nextInLine.id },
            data: { status: 'APPROVED' }
          })
          
          // Add an AuditLog entry for the auto-promotion
          await tx.auditLog.create({
            data: {
              action: "AUTO_PROMOTE_WAITLIST",
              projectId: reg.projectId,
              studentId: nextInLine.studentId,
              payload: JSON.stringify({ previousStatus: 'WAITLISTED', newStatus: 'APPROVED', promotedDueToCancellationOf: registrationId })
            }
          })
        }
      }

      return { success: true }
    })

    return result

  } catch (error: any) {
    return { error: error.message || 'Cancellation failed' }
  }
}

export async function approveAllWaitlist(projectId: number) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
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

    return result

  } catch (error: any) {
    return { error: error.message || 'Approval failed' }
  }
}

