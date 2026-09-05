import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const isExpoline = user.role === 'SUPER_ADMIN' || user.role === 'EXPOLINE_STAFF';
    const logs = await prisma.auditLog.findMany({
      where: isExpoline ? {} : { companyId: user.companyId || '__none__' },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    return NextResponse.json({ error: 'Unable to load audit log.' }, { status: 500 });
  }
}
