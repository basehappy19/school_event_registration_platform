"use server"

import prisma from "@/lib/prisma"
import { promoteEligibleWaitlist } from "@/lib/quota"
import { auth } from "@/auth"
import { headers } from "next/headers"
import { getClientIp } from "@/lib/ip"
import { revalidatePath, revalidateTag } from "next/cache"
import { UpdateProjectPayload } from "@/app/types"
import fs from "fs"
import path from "path"

async function checkAdmin() {
  const session = await auth()
  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized")
  }
  return session.user?.email || "ADMIN"
}

export async function createProject(data: { title: string, description?: string, startDate: Date, endDate: Date }) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
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
    await prisma.projectEditLog.create({
      data: {
        projectId: project.id,
        projectTitle: project.title,
        adminEmail,
        action: "CREATE_PROJECT",
        changes: JSON.stringify({ newProject: data }),
        ipAddress: ip,
        userAgent
      }
    })
    revalidatePath('/admin')
    return { success: true, project }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateProjectSettings(projectId: number, payload: UpdateProjectPayload) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const { quotas, formFields, ...data } = payload

    const oldProject = await prisma.project.findUnique({ 
      where: { id: projectId }, 
      include: { quotas: true, formFields: true } 
    })
    if (oldProject?.posterUrl && data.posterUrl !== undefined && oldProject.posterUrl !== data.posterUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', oldProject.posterUrl)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (err) {
        console.error("Failed to delete old poster", err)
      }
    }

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
      const fieldIdsToKeep = formFields.filter((f: any) => f.id).map((f: any) => f.id)
      const fieldsToDelete = existingFields.filter((f: any) => !fieldIdsToKeep.includes(f.id))
      
      if (fieldsToDelete.length > 0) {
        await prisma.formField.deleteMany({
          where: { id: { in: fieldsToDelete.map((f: any) => f.id) } }
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

    await prisma.projectEditLog.create({
      data: {
        projectId,
        projectTitle: project.title,
        adminEmail,
        action: "UPDATE_PROJECT",
        changes: JSON.stringify({
          before: {
            title: oldProject?.title,
            isPublished: oldProject?.isPublished,
            isRegistrationOpen: oldProject?.isRegistrationOpen,
            isAnnouncementOpen: oldProject?.isAnnouncementOpen,
            quotas: oldProject?.quotas
          },
          after: payload
        }),
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    revalidatePath(`/detail/${projectId}`)
    return { success: true, project }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminSearchStudents(query: string) {
  await checkAdmin()
  if (!query || query.trim().length === 0) return []
  try {
    const students = await prisma.studentProfile.findMany({
      where: {
        OR: [
          { studentId: { contains: query.trim() } },
          { firstName: { contains: query.trim() } },
          { lastName: { contains: query.trim() } }
        ]
      },
      take: 10,
      select: {
        studentId: true,
        prefix: true,
        firstName: true,
        lastName: true,
        grade: true,
        room: true,
        number: true
      }
    })
    return students
  } catch (error) {
    return []
  }
}

export async function adminAddRegistration(projectId: number, studentId: string) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
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

    const proj = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    await prisma.registrationLog.create({
      data: {
        action: "ADMIN_ADD",
        projectId,
        projectTitle: proj?.title || "",
        studentId,
        studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
        gradeRoom: `ม.${student.grade}/${student.room}`,
        newStatus: "APPROVED",
        performedBy: `ADMIN:${adminEmail}`,
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath(`/announcement/${projectId}`)
    revalidatePath('/announcement/[id]', 'page')
    return { success: true, registration }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminDeleteRegistration(registrationId: string) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.findUnique({ where: { id: registrationId }, include: { studentProfile: true } })
      if (!reg) return
      await tx.registration.delete({ where: { id: registrationId } })

      const proj = await tx.project.findUnique({ where: { id: reg.projectId }, select: { title: true } })
      await tx.registrationLog.create({
        data: {
          action: "ADMIN_DELETE",
          projectId: reg.projectId,
          projectTitle: proj?.title || "",
          studentId: reg.studentId,
          studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          previousStatus: reg.status,
          newStatus: "DELETED",
          performedBy: `ADMIN:${adminEmail}`,
          ipAddress: ip,
          userAgent
        }
      })

      if (reg.status === 'APPROVED') {
        await promoteEligibleWaitlist(tx, reg.projectId)
      }
    })
    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath('/announcement/[id]', 'page')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAcceptRegistration(regId: string) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const reg = await prisma.registration.findUnique({ where: { id: regId }, include: { studentProfile: true } })
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'APPROVED' }
    })
    if (reg) {
      const proj = await prisma.project.findUnique({ where: { id: reg.projectId }, select: { title: true } })
      await prisma.registrationLog.create({
        data: {
          action: "ADMIN_APPROVE",
          projectId: reg.projectId,
          projectTitle: proj?.title || "",
          studentId: reg.studentId,
          studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          previousStatus: reg.status,
          newStatus: "APPROVED",
          performedBy: `ADMIN:${adminEmail}`,
          ipAddress: ip,
          userAgent
        }
      })
    }
    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath('/announcement/[id]', 'page')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminRejectRegistration(regId: string) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const reg = await prisma.registration.findUnique({ where: { id: regId }, include: { studentProfile: true } })
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'REJECTED' }
    })
    if (reg) {
      const proj = await prisma.project.findUnique({ where: { id: reg.projectId }, select: { title: true } })
      await prisma.registrationLog.create({
        data: {
          action: "ADMIN_REJECT",
          projectId: reg.projectId,
          projectTitle: proj?.title || "",
          studentId: reg.studentId,
          studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          previousStatus: reg.status,
          newStatus: "REJECTED",
          performedBy: `ADMIN:${adminEmail}`,
          ipAddress: ip,
          userAgent
        }
      })
    }
    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath('/announcement/[id]', 'page')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminWaitlistRegistration(regId: string) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const reg = await prisma.registration.findUnique({ where: { id: regId }, include: { studentProfile: true } })
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'WAITLISTED' }
    })
    if (reg) {
      const proj = await prisma.project.findUnique({ where: { id: reg.projectId }, select: { title: true } })
      await prisma.registrationLog.create({
        data: {
          action: "ADMIN_WAITLIST",
          projectId: reg.projectId,
          projectTitle: proj?.title || "",
          studentId: reg.studentId,
          studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          previousStatus: reg.status,
          newStatus: "WAITLISTED",
          performedBy: `ADMIN:${adminEmail}`,
          ipAddress: ip,
          userAgent
        }
      })
    }
    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath('/announcement/[id]', 'page')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAcceptAllWaitlist(projectId: number) {
  await checkAdmin()
  try {
    await prisma.registration.updateMany({
      where: { projectId, status: 'WAITLISTED' },
      data: { status: 'APPROVED' }
    })
    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath(`/announcement/${projectId}`)
    revalidatePath('/announcement/[id]', 'page')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function deleteProject(projectId: number) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true, posterUrl: true } })
    if (project?.posterUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', project.posterUrl)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (err) {
        console.error("Failed to delete project poster", err)
      }
    }

    await prisma.project.delete({
      where: { id: projectId }
    })

    await prisma.projectEditLog.create({
      data: {
        projectId,
        projectTitle: project?.title || `Project ID ${projectId}`,
        adminEmail,
        action: "DELETE_PROJECT",
        changes: JSON.stringify({ deleted: true }),
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateProjectsOrder(orderedIds: number[]) {
  await checkAdmin()
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.project.update({
        where: { id: orderedIds[i] },
        data: { order: i }
      })
    }
    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getSystemLogs(limit = 100) {
  await checkAdmin()
  try {
    const registrationLogs = await prisma.registrationLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    const projectEditLogs = await prisma.projectEditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    const adminLoginLogs = await prisma.adminLoginLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, registrationLogs, projectEditLogs, adminLoginLogs }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminRolloverPromoteWaitlist(projectId: number) {
  const adminEmail = await checkAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quotas = await tx.$queryRaw<any[]>`
        SELECT * FROM "ProjectQuota" WHERE "projectId" = ${projectId} FOR UPDATE
      `
      const totalCapacity = quotas.reduce((sum, q) => sum + Number(q.capacity || 0), 0)
      const approvedCount = await tx.registration.count({ where: { projectId, status: 'APPROVED' } })
      
      let totalRemaining = Math.max(0, totalCapacity - approvedCount)
      if (totalRemaining === 0) {
        throw new Error("โควตารวมของโครงการเต็มแล้ว ไม่สามารถรับเพิ่มตามการส่งต่อได้")
      }

      const sortedGrades = quotas.map(q => q.grade).sort((a, b) => Number(b) - Number(a))

      let totalPromoted = 0
      let rolloverPool = 0

      for (const grade of sortedGrades) {
        if (totalRemaining <= 0) break

        const q = quotas.find(item => item.grade === grade)
        const cap = q ? Number(q.capacity || 0) : 0
        const approvedInGrade = await tx.registration.count({
          where: { projectId, status: 'APPROVED', studentProfile: { grade } }
        })

        const vacantInGrade = Math.max(0, cap - approvedInGrade)
        let poolForGrade = vacantInGrade + rolloverPool

        const waitlistedInGrade = await tx.registration.findMany({
          where: { projectId, status: 'WAITLISTED', studentProfile: { grade } },
          include: { studentProfile: true },
          orderBy: { createdAt: 'asc' }
        })

        let promotedInGradeCount = 0
        for (const reg of waitlistedInGrade) {
          if (poolForGrade <= 0 || totalRemaining <= 0) break

          await tx.registration.update({
            where: { id: reg.id },
            data: { status: 'APPROVED' }
          })

          const proj = await tx.project.findUnique({ where: { id: projectId }, select: { title: true } })
          await tx.registrationLog.create({
            data: {
              action: "ADMIN_ROLLOVER",
              projectId,
              projectTitle: proj?.title || "",
              studentId: reg.studentId,
              studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
              gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
              previousStatus: "WAITLISTED",
              newStatus: "APPROVED",
              performedBy: `ADMIN:${adminEmail}`,
              ipAddress: ip,
              userAgent,
              details: JSON.stringify({ grade, rolloverUsed: rolloverPool > 0 })
            }
          })

          poolForGrade--
          totalRemaining--
          promotedInGradeCount++
        }

        rolloverPool = poolForGrade
        totalPromoted += promotedInGradeCount
      }

      return { totalPromoted }
    })

    revalidatePath('/admin')
    revalidateTag('announcements', 'default')
    revalidatePath(`/announcement/${projectId}`)
    revalidatePath('/announcement/[id]', 'page')
    return { success: true, totalPromoted: result.totalPromoted }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminAnalyzeAllocation(projectId: number) {
  await checkAdmin()
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        quotas: true,
        registrations: {
          include: { studentProfile: true },
          orderBy: [{ createdAt: 'asc' }]
        }
      }
    })
    if (!project) throw new Error("Project not found")

    const totalCapacity = project.quotas.reduce((sum, q) => sum + Number(q.capacity || 0), 0)
    const approvedTotalCount = project.registrations.filter(r => r.status === 'APPROVED').length
    const totalRemaining = Math.max(0, totalCapacity - approvedTotalCount)

    const sortedGrades = project.quotas.map(q => q.grade).sort((a, b) => Number(b) - Number(a))

    const gradeAnalysis: any[] = []
    let currentRollover = 0
    let remainingProjectSeats = totalRemaining

    for (const grade of sortedGrades) {
      const q = project.quotas.find(item => item.grade === grade)
      const cap = q ? Number(q.capacity || 0) : 0
      const approvedCount = project.registrations.filter(r => r.status === 'APPROVED' && r.studentProfile.grade === grade).length
      const vacant = Math.max(0, cap - approvedCount)
      
      const pool = vacant + currentRollover
      const waitlisted = project.registrations.filter(r => r.status === 'WAITLISTED' && r.studentProfile.grade === grade)
      const waitlistCount = waitlisted.length

      const willPromote = Math.min(waitlistCount, pool, remainingProjectSeats)
      const unusedAfterPromote = Math.max(0, pool - willPromote)
      remainingProjectSeats -= willPromote

      gradeAnalysis.push({
        grade,
        capacity: cap,
        approved: approvedCount,
        vacant,
        receivedRollover: currentRollover,
        totalPool: pool,
        waitlistCount,
        willPromote,
        passDownRollover: unusedAfterPromote
      })

      currentRollover = unusedAfterPromote
    }

    const waitlistedStudents = project.registrations
      .filter(r => r.status === 'WAITLISTED')
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime()
        const timeB = new Date(b.createdAt || 0).getTime()
        if (timeA !== timeB) {
          return timeA - timeB
        }
        const gradeA = Number(a.studentProfile?.grade || 0)
        const gradeB = Number(b.studentProfile?.grade || 0)
        return gradeB - gradeA
      })
      .map((reg, index) => {
        const grade = reg.studentProfile.grade
        const ga = gradeAnalysis.find(g => g.grade === grade)
        let adviceType = "NORMAL"
        let adviceText = ""

        if (totalRemaining <= 0) {
          adviceType = "FULL_TOTAL"
          adviceText = `⚠️ โควตารวมโครงการเต็มแล้ว (${approvedTotalCount}/${totalCapacity}) หากกดรับสิทธิ์ ยอดรวมจะเกินกำหนด`
        } else if (ga && ga.vacant > 0) {
          adviceType = "VACANT_OWN"
          adviceText = `✅ โควตา ม.${grade} ยังว่างอยู่ (${ga.approved}/${ga.capacity}) สามารถรับเข้าโควตาชั้นตัวเองได้ทันที`
        } else if (ga && ga.receivedRollover > 0) {
          const gaIdx = gradeAnalysis.findIndex(g => g.grade === grade)
          const donorGrade = gaIdx > 0 ? gradeAnalysis[gaIdx - 1].grade : 'ก่อนหน้า'
          adviceType = "ROLLOVER_DONOR"
          adviceText = `💡 โควตา ม.${grade} เต็มแล้ว แต่สามารถใช้โควตาว่างที่ส่งต่อจาก ม.${donorGrade} (จำนวน ${ga.receivedRollover} ที่นั่ง)`
        } else {
          adviceType = "NO_QUOTA"
          adviceText = `🔸 โควตาชั้นตัวเองเต็มแล้ว (แต่โควตารวมโครงการยังเหลืออีก ${totalRemaining} ที่นั่ง สามารถรับพิเศษได้)`
        }

        return {
          registrationId: reg.id,
          studentId: reg.studentId,
          name: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
          gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
          createdAt: reg.createdAt,
          queueNumber: index + 1,
          adviceType,
          adviceText
        }
      })

    return {
      success: true,
      summary: {
        totalCapacity,
        approvedTotalCount,
        totalRemaining
      },
      gradeAnalysis,
      waitlistedStudents
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
