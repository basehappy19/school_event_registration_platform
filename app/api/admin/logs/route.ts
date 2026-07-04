import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [registrationLogs, projectEditLogs, adminLoginLogs, auditLogs, projects] = await Promise.all([
    prisma.registrationLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    }),
    isSuperAdmin ? prisma.projectEditLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    }) : Promise.resolve([]),
    isSuperAdmin ? prisma.adminLoginLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    }) : Promise.resolve([]),
    isSuperAdmin ? prisma.auditLog.findMany({
      where: { action: { in: ['CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN'] } },
      take: 200,
      orderBy: { createdAt: 'desc' }
    }) : Promise.resolve([]),
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        activityDate: true,
        activityLocation: true,
      }
    })
  ]);

  return NextResponse.json({
    registrationLogs,
    projectEditLogs,
    adminLoginLogs,
    auditLogs,
    projects
  });
}
