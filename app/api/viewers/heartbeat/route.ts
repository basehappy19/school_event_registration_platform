import { NextResponse } from 'next/server';
import { updateHeartbeat } from '@/lib/viewerTracker';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, visitorId, leave } = body;

    if ((typeof projectId === 'string' || typeof projectId === 'number') && typeof visitorId === 'string') {
      updateHeartbeat(String(projectId), visitorId, Boolean(leave));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
