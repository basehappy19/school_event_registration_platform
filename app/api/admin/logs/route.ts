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

  const [registrationLogs, projectEditLogs, adminLoginLogs] = await Promise.all([
    prisma.registrationLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.projectEditLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.adminLoginLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return NextResponse.json({
    registrationLogs,
    projectEditLogs,
    adminLoginLogs
  });
}
