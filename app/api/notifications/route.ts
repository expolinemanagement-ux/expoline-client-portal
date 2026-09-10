import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await requireUser();
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (body.all === true) {
      const result = await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
      await audit(user.id, user.companyId || undefined, 'MARK_NOTIFICATIONS_READ', 'Notification', undefined, { count: result.count, all: true });
    } else if (typeof body.id === 'string') {
      const result = await prisma.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { readAt: new Date() } });
      if (result.count > 0) await audit(user.id, user.companyId || undefined, 'MARK_NOTIFICATION_READ', 'Notification', body.id);
    } else {
      return NextResponse.json({ error: 'Notification id or all=true is required.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    return NextResponse.json({ error: 'Unable to update notification.' }, { status: 500 });
  }
}
