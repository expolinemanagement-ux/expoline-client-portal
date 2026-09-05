import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
    if (newPassword.length < 10 || newPassword.length > 128) return NextResponse.json({ error: 'New password must be between 10 and 128 characters.' }, { status: 400 });
    if (currentPassword === newPassword) return NextResponse.json({ error: 'New password must be different from the current password.' }, { status: 400 });

    const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!stored?.passwordHash || !(await verifyPassword(currentPassword, stored.passwordHash))) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await audit(user.id, user.companyId || undefined, 'CHANGE_PASSWORD', 'User', user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    return NextResponse.json({ error: 'Unable to change password.' }, { status: 500 });
  }
}
