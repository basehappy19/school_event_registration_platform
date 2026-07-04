"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { headers } from "next/headers"
import { getClientIp } from "@/lib/ip"
import { revalidatePath } from "next/cache"

async function checkSuperAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้น")
  }
  return session.user?.email || "SUPER_ADMIN"
}

export async function getAdminUsersWithStats() {
  await checkSuperAdmin()
  const admins = await prisma.adminUser.findMany({
    orderBy: { id: 'asc' }
  })

  const adminsWithStats = await Promise.all(
    admins.map(async (admin) => {
      const [loginCount, editCount, regCount] = await Promise.all([
        prisma.adminLoginLog.count({ where: { emailAttempt: admin.email } }),
        prisma.projectEditLog.count({ where: { adminEmail: admin.email } }),
        prisma.registrationLog.count({ where: { performedBy: { contains: admin.email } } })
      ])
      return {
        ...admin,
        stats: {
          loginCount,
          editCount,
          regCount,
          totalCount: loginCount + editCount + regCount
        }
      }
    })
  )

  return adminsWithStats
}

export async function getAdminDetailedLogs(email: string) {
  await checkSuperAdmin()
  const [loginLogs, editLogs, regLogs, auditLogs] = await Promise.all([
    prisma.adminLoginLog.findMany({
      where: { emailAttempt: email },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.projectEditLog.findMany({
      where: { adminEmail: email },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.registrationLog.findMany({
      where: { performedBy: { contains: email } },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.auditLog.findMany({
      where: { 
        adminEmail: email,
        action: { in: ['CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  ])

  const combined: Array<{
    id: string
    type: 'LOGIN' | 'EDIT' | 'REGISTRATION' | 'ADMIN_MGMT'
    action: string
    details: string
    ipAddress?: string | null
    createdAt: Date
  }> = [
    ...loginLogs.map(l => ({
      id: `login-${l.id}`,
      type: 'LOGIN' as const,
      action: l.status === 'SUCCESS' ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ',
      details: l.failureReason || 'เข้าสู่ระบบผู้ดูแลระบบ',
      ipAddress: l.ipAddress,
      createdAt: l.createdAt
    })),
    ...editLogs.map(e => ({
      id: `edit-${e.id}`,
      type: 'EDIT' as const,
      action: e.action === 'CREATE_PROJECT' ? 'สร้างโครงการ' : e.action === 'UPDATE_PROJECT' ? 'แก้ไขโครงการ' : e.action === 'TOGGLE_PUBLISH' ? 'เปลี่ยนสถานะเผยแพร่' : e.action === 'DELETE_PROJECT' ? 'ลบโครงการ' : e.action,
      details: `โครงการ: ${e.projectTitle}`,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt
    })),
    ...regLogs.map(r => ({
      id: `reg-${r.id}`,
      type: 'REGISTRATION' as const,
      action: r.action === 'ADMIN_APPROVE' ? 'อนุมัติรายชื่อ' : r.action === 'ADMIN_REJECT' ? 'ปฏิเสธรายชื่อ' : r.action === 'ADMIN_WAITLIST' ? 'ย้ายไปตัวสำรอง' : r.action === 'ADMIN_DELETE' ? 'ลบรายชื่อ' : r.action === 'ADMIN_ADD' ? 'เพิ่มรายชื่อ' : r.action === 'ADMIN_ROLLOVER' || r.action === 'ROLLOVER' ? 'เลื่อนลำดับ (ทบโควตาว่าง)' : r.action === 'AUTO_PROMOTE' || r.action === 'AUTO_PROMOTE_WAITLIST' ? 'เลื่อนลำดับอัตโนมัติ' : r.action,
      details: `นักเรียน: ${r.studentName || r.studentId} (โครงการ: ${r.projectTitle || r.projectId})`,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt
    })),
    ...auditLogs.map(a => {
      let detailsText = `ทำรายการ: ${a.action}`;
      try {
        const p = JSON.parse(a.payload || '{}');
        if (a.action === 'CREATE_ADMIN') {
          const roleTh = p.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
          detailsText = `เพิ่มแอดมินใหม่: ${p.name || '-'} (${p.email || '-'}) [สิทธิ์: ${roleTh}]`;
        } else if (a.action === 'UPDATE_ADMIN') {
          const targetEmail = p.new?.email || p.old?.email || '-';
          const targetName = p.new?.name || p.old?.name || '-';
          const changes: string[] = [];
          
          if (p.old?.name !== p.new?.name && (p.old?.name || p.new?.name)) {
            changes.push(`ชื่อ: "${p.old?.name || '-'}" ➡️ "${p.new?.name || '-'}"`);
          }
          if (p.old?.role !== p.new?.role && (p.old?.role || p.new?.role)) {
            const oldRole = p.old?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
            const newRole = p.new?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
            changes.push(`สิทธิ์: [${oldRole}] ➡️ [${newRole}]`);
          }
          
          const changeStr = changes.length > 0 ? changes.join(', ') : 'บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)';
          detailsText = `แก้ไขแอดมิน: ${targetName} (${targetEmail}) | เปลี่ยนแปลง -> ${changeStr}`;
        } else if (a.action === 'DELETE_ADMIN') {
          const roleTh = p.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
          detailsText = `ลบแอดมิน: ${p.name || '-'} (${p.email || '-'}) [สิทธิ์เดิม: ${roleTh}]`;
        } else if (p.email) {
          detailsText = `แอดมิน: ${p.name || p.email} (${p.role || ''})`;
        } else if (p.targetId) {
          detailsText = `รหัสแอดมิน: ${p.targetId}`;
        }
      } catch (e) {}

      return {
        id: `audit-${a.id}`,
        type: 'ADMIN_MGMT' as const,
        action: a.action === 'CREATE_ADMIN' ? 'เพิ่มแอดมิน' : a.action === 'UPDATE_ADMIN' ? 'แก้ไขแอดมิน' : a.action === 'DELETE_ADMIN' ? 'ลบแอดมิน' : a.action,
        details: detailsText,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt
      };
    })
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 200)

  return {
    stats: {
      loginCount: loginLogs.length,
      editCount: editLogs.length,
      regCount: regLogs.length,
      adminMgmtCount: auditLogs.length,
      totalCount: loginLogs.length + editLogs.length + regLogs.length + auditLogs.length
    },
    logs: combined
  }
}

export async function createAdminUser(data: { email: string, name?: string, role: 'ADMIN' | 'SUPER_ADMIN' }) {
  const superEmail = await checkSuperAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'

  try {
    const cleanEmail = data.email.trim().toLowerCase()
    if (!cleanEmail) {
      return { error: "กรุณาระบุอีเมล" }
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email: cleanEmail }
    })

    if (existing) {
      return { error: "อีเมลนี้มีอยู่ในระบบผู้ดูแลระบบแล้ว" }
    }

    const newAdmin = await prisma.adminUser.create({
      data: {
        email: cleanEmail,
        name: data.name?.trim() || cleanEmail.split('@')[0],
        role: data.role
      }
    })

    await prisma.auditLog.create({
      data: {
        action: "CREATE_ADMIN",
        adminEmail: superEmail,
        payload: JSON.stringify(newAdmin),
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin/users')
    return { success: true, admin: newAdmin }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function updateAdminUser(id: number, data: { name?: string, role?: 'ADMIN' | 'SUPER_ADMIN' }) {
  const superEmail = await checkSuperAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'

  try {
    const targetAdmin = await prisma.adminUser.findUnique({ where: { id } })
    if (!targetAdmin) {
      return { error: "ไม่พบข้อมูลผู้ดูแลระบบ" }
    }

    if (targetAdmin.role === 'SUPER_ADMIN' && data.role === 'ADMIN') {
      const superCount = await prisma.adminUser.count({ where: { role: 'SUPER_ADMIN' } })
      if (superCount <= 1) {
        return { error: "ไม่สามารถลดขั้นผู้ดูแลระบบสูงสุด (Super Admin) คนสุดท้ายได้" }
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        role: data.role !== undefined ? data.role : undefined
      }
    })

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_ADMIN",
        adminEmail: superEmail,
        payload: JSON.stringify({ old: targetAdmin, new: updated }),
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin/users')
    return { success: true, admin: updated }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function deleteAdminUser(id: number) {
  const superEmail = await checkSuperAdmin()
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get('user-agent') || 'Unknown'

  try {
    const targetAdmin = await prisma.adminUser.findUnique({ where: { id } })
    if (!targetAdmin) {
      return { error: "ไม่พบข้อมูลผู้ดูแลระบบ" }
    }

    if (targetAdmin.role === 'SUPER_ADMIN') {
      const superCount = await prisma.adminUser.count({ where: { role: 'SUPER_ADMIN' } })
      if (superCount <= 1) {
        return { error: "ไม่สามารถลบผู้ดูแลระบบสูงสุด (Super Admin) คนสุดท้ายของระบบได้" }
      }
    }

    await prisma.adminUser.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        action: "DELETE_ADMIN",
        adminEmail: superEmail,
        payload: JSON.stringify(targetAdmin),
        ipAddress: ip,
        userAgent
      }
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
