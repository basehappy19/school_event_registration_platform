"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

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
    return { success: true, project }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateProjectSettings(projectId: number, data: any) {
  await checkAdmin()
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data
    })
    return { success: true, project }
  } catch (error: any) {
    return { error: error.message }
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
    return { success: true, registration }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function adminDeleteRegistration(registrationId: number) {
  await checkAdmin()
  try {
    await prisma.registration.delete({
      where: { id: registrationId }
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function adminAcceptRegistration(regId: number) {
  await checkAdmin()
  try {
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'APPROVED' }
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function adminAcceptAllWaitlist(projectId: number) {
  await checkAdmin()
  try {
    await prisma.registration.updateMany({
      where: { projectId, status: 'WAITLISTED' },
      data: { status: 'APPROVED' }
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
