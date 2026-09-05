import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      personnel: { orderBy: { createdAt: 'desc' } },
      requests: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { users: true, personnel: true, requests: true, documents: true } },
    },
  });
  if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name.trim(),
        registrationNumber: body.registrationNumber?.trim() || null,
        address: body.address?.trim() || null,
        contactEmail: body.contactEmail?.trim() || null,
        contactPhone: body.contactPhone?.trim() || null,
        status: body.status !== false,
      },
    });
    return NextResponse.json(company);
  } catch {
    return NextResponse.json({ error: 'Unable to update company.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete company.' }, { status: 500 });
  }
}
