import { Prisma } from "@prisma/client"

export async function promoteEligibleWaitlist(tx: Prisma.TransactionClient, projectId: string) {
  // Lock all Project Quotas for the project to prevent race conditions
  const allQuotas: any[] = await tx.$queryRaw`
    SELECT * FROM "ProjectQuota" 
    WHERE "projectId" = ${projectId}
    FOR UPDATE
  `
  const totalProjectCapacity = allQuotas.reduce((sum, q) => sum + Number(q.capacity || 0), 0)

  while (true) {
    const approvedTotalCount = await tx.registration.count({
      where: { projectId, status: 'APPROVED' }
    })

    if (approvedTotalCount >= totalProjectCapacity) {
      break // Project overall capacity full
    }

    const waitlisted = await tx.registration.findMany({
      where: { projectId, status: 'WAITLISTED' },
      include: { studentProfile: true },
      orderBy: { createdAt: 'asc' }
    })

    let promotedAny = false
    for (const reg of waitlisted) {
      const quota = allQuotas.find(q => q.grade === reg.studentProfile.grade)
      if (!quota) continue

      const approvedGradeCount = await tx.registration.count({
        where: { projectId, studentProfile: { grade: reg.studentProfile.grade }, status: 'APPROVED' }
      })

      // If both grade quota and total quota are not full
      if (approvedGradeCount < quota.capacity) {
        await tx.registration.update({
          where: { id: reg.id },
          data: { status: 'APPROVED' }
        })

        await tx.auditLog.create({
          data: {
            action: "AUTO_PROMOTE_WAITLIST",
            projectId,
            studentId: reg.studentId,
            payload: JSON.stringify({ previousStatus: 'WAITLISTED', newStatus: 'APPROVED' })
          }
        })

        const proj = await tx.project.findUnique({ where: { id: projectId }, select: { title: true } })
        await tx.registrationLog.create({
          data: {
            action: "AUTO_PROMOTE",
            projectId,
            projectTitle: proj?.title || "",
            studentId: reg.studentId,
            studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
            gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
            previousStatus: "WAITLISTED",
            newStatus: "APPROVED",
            performedBy: "SYSTEM:AUTO_PROMOTE",
            details: JSON.stringify({ promotedRegistrationId: reg.id })
          }
        })

        promotedAny = true
        break // Re-evaluate total counts after promoting one student
      }
    }

    if (!promotedAny) {
      break // No waitlisted student could be promoted without exceeding grade capacity
    }
  }
}
