"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { UpdateProjectPayload } from "@/app/types"

async function checkAdmin() {
  const session = await auth()
  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized")
  }
}

export async function createProject(data: { title: string, description?: string, startDate: Date, endDate: Date }) {
  await checkAdmin()
  try {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublished: false,
        isRegistrationOpen: false,
        isAnnouncementOpen: false,
      }
    })
    revalidatePath('/admin')
    return { success: true, project }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateProjectSettings(projectId: number, payload: UpdateProjectPayload) {
  await checkAdmin()
  try {
    const { quotas, formFields, ...data } = payload

    const project = await prisma.project.update({
      where: { id: projectId },
      data
    })

    if (quotas !== undefined) {
      await prisma.projectQuota.deleteMany({ where: { projectId } })
      if (quotas.length > 0) {
        await prisma.projectQuota.createMany({
          data: quotas.map((q) => ({
            projectId,
            grade: q.grade,
            capacity: q.capacity
          }))
        })
      }
    }

    if (formFields !== undefined) {
      const existingFields = await prisma.formField.findMany({ where: { projectId } })
      const fieldIdsToKeep = formFields.filter(f => f.id).map(f => f.id)
      const fieldsToDelete = existingFields.filter(f => !fieldIdsToKeep.includes(f.id))
      
      if (fieldsToDelete.length > 0) {
        await prisma.formField.deleteMany({
          where: { id: { in: fieldsToDelete.map(f => f.id) } }
        })
      }

      for (const field of formFields) {
        if (field.id) {
          await prisma.formField.update({
            where: { id: field.id },
            data: {
              label: field.label,
              type: field.type,
              options: field.options,
              isRequired: field.isRequired
            }
          })
        } else {
          await prisma.formField.create({
            data: {
              projectId,
              label: field.label,
              type: field.type,
              options: field.options,
              isRequired: field.isRequired
            }
          })
        }
      }
    }

    revalidatePath('/admin')
    return { success: true, project }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAddRegistration(projectId: number, studentId: string) {
  await checkAdmin()
  try {
    const student = await prisma.studentProfile.findUnique({ where: { studentId } })
    if (!student) throw new Error("Student not found")

    const existing = await prisma.registration.findUnique({
      where: { projectId_studentId: { projectId, studentId } }
    })
    if (existing) throw new Error("Student already registered")

    const registration = await prisma.registration.create({
      data: {
        projectId,
        studentId,
        status: 'APPROVED',
      }
    })
    revalidatePath('/admin')
    return { success: true, registration }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminDeleteRegistration(registrationId: number) {
  await checkAdmin()
  try {
    await prisma.registration.delete({
      where: { id: registrationId }
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAcceptRegistration(regId: number) {
  await checkAdmin()
  try {
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'APPROVED' }
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAcceptAllWaitlist(projectId: number) {
  await checkAdmin()
  try {
    await prisma.registration.updateMany({
      where: { projectId, status: { not: 'APPROVED' } },
      data: { status: 'APPROVED' }
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function deleteProject(projectId: number) {
  await checkAdmin()
  try {
    await prisma.project.delete({
      where: { id: projectId }
    })
    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
