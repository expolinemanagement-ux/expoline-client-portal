import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { canAccessCompany, requireUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const request = await prisma.request.findUnique({ where: { id }, select: { companyId: true } });
    if (!request || !canAccessCompany(user, request.companyId)) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    const messages = await prisma.requestMessage.findMany({
      where: { requestId: id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unable to load messages.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const item = await prisma.request.findUnique({
      where: { id },
      select: { id: true, companyId: true, title: true },
    });
    if (!item || !canAccessCompany(user, item.companyId)) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    const body = await request.json();
    const message = String(body.body || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
    }

    const created = await prisma.requestMessage.create({
      data: { requestId: id, senderId: user.id, body: message },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    await audit(user.id, item.companyId, 'CREATE', 'RequestMessage', created.id, { requestId: id });

    const recipients =
      user.role === 'SUPER_ADMIN' || user.role === 'EXPOLINE_STAFF'
        ? await prisma.user.findMany({
            where: { companyId: item.companyId, active: true, id: { not: user.id } },
            select: { id: true },
          })
        : await prisma.user.findMany({
            where: { active: true, role: { in: ['SUPER_ADMIN', 'EXPOLINE_STAFF'] }, id: { not: user.id } },
            select: { id: true },
          });

    if (recipients.length) {
      await prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          title: `New message: ${item.title}`,
          message: `${user.name} sent a message on a client request.`,
          type: 'REQUEST_MESSAGE',
        })),
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unable to send message.' }, { status: 500 });
  }
}
