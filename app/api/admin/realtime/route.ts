import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getViewerCounts } from '@/lib/viewerTracker';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projects = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { id: 'desc' }],
    include: {
      quotas: true,
      formFields: true,
      registrations: {
        include: {
          studentProfile: true,
          answers: true
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  });

  const viewerCounts = getViewerCounts();

  return NextResponse.json({ projects, viewerCounts });
}
