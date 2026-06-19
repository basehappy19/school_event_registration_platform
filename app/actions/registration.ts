"use server"

import prisma from "@/lib/prisma"

export async function submitRegistration(data: {
  projectId: string,
  studentId: string,
  nationalIdSuffix: string, // The last 5 digits provided by user
  formAnswers: { fieldId: string, value: string }[]
}) {
  // Validate Student using Last 5 Digits
  const student = await prisma.studentProfile.findUnique({
    where: { studentId: data.studentId }
  })

  if (!student || !student.nationalId.endsWith(data.nationalIdSuffix)) {
    return { error: 'Invalid Student ID or National ID' }
  }

  // Handle Registration in Transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // a. Check if already registered for this project
      const existing = await tx.registration.findFirst({
        where: { projectId: data.projectId, masterStudentId: student.studentId }
      })

      if (existing) {
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
        throw new Error("Registration is not available for this grade")
      }

      // c. Count current APPROVED registrations for this grade
      const approvedCount = await tx.registration.count({
        where: { projectId: data.projectId, grade: student.grade, status: 'APPROVED' }
      })

      const status = approvedCount < quota.capacity ? 'APPROVED' : 'WAITLISTED'

      // d. Create Snapshot Registration
      const registration = await tx.registration.create({
        data: {
          projectId: data.projectId,
          studentIdInput: student.studentId, // From input, but verified
          prefix: student.prefix,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          room: student.room,
          number: student.number,
          status: status,
          masterStudentId: student.studentId, // Link to master data
          answers: {
            create: data.formAnswers.map(ans => ({
              fieldId: ans.fieldId,
              value: ans.value
            }))
          }
        }
      })

      return registration
    })

    return { success: true, status: result.status, registrationId: result.id }

  } catch (error: any) {
    return { error: error.message || 'Registration failed' }
  }
}

export async function cancelRegistration(registrationId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the registration to cancel
      const reg = await tx.registration.findUnique({
        where: { id: registrationId }
      })

      if (!reg || reg.status === 'CANCELLED') {
        throw new Error("Registration not found or already cancelled")
      }

      // 2. Mark as Cancelled
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' }
      })

      // 3. Auto-Replacement: If it was APPROVED, we need to promote a WAITLISTED student
      if (reg.status === 'APPROVED') {
        // Find the first WAITLISTED student in the same project and grade
        const nextInLine = await tx.registration.findFirst({
          where: { projectId: reg.projectId, grade: reg.grade, status: 'WAITLISTED' },
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
              studentId: nextInLine.studentIdInput,
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
