import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getSystemUser() {
  const existing = await prisma.user.findFirst({ where: { role: 'EXPOLINE_STAFF', active: true } });
  if (existing) return existing;
  return prisma.user.create({ data: { name: 'Expoline Staff', email: 'staff@local.expoline', role: 'EXPOLINE_STAFF' } });
}

export async function GET() {
  const requests = await prisma.request.findMany({ include: { company: true, personnel: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.companyName?.trim()) return NextResponse.json({ error: 'Title and company are required.' }, { status: 400 });
    const company = await prisma.company.findFirst({ where: { name: body.companyName.trim() } });
    if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    const personnel = body.personnelName ? await prisma.personnel.findFirst({ where: { fullName: body.personnelName, companyId: company.id } }) : null;
    const user = await getSystemUser();
    const priorityMap: Record<string, 'LOW'|'NORMAL'|'HIGH'|'URGENT'> = { Low:'LOW', Normal:'NORMAL', High:'HIGH', Urgent:'URGENT' };
    const statusMap: Record<string, 'PENDING'|'SUBMITTED'|'UNDER_REVIEW'|'APPROVED'|'REVISION_REQUIRED'|'REJECTED'|'CANCELLED'> = { Pending:'PENDING', Submitted:'SUBMITTED', 'Under Review':'UNDER_REVIEW', Approved:'APPROVED', 'Revision Required':'REVISION_REQUIRED', Rejected:'REJECTED', Cancelled:'CANCELLED' };
    const item = await prisma.request.create({ data: {
      companyId: company.id,
      personnelId: personnel?.id ?? null,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      priority: priorityMap[body.priority] ?? 'NORMAL',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: statusMap[body.status] ?? 'PENDING',
      createdById: user.id,
    }, include: { company: true, personnel: true } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to save request.' }, { status: 500 });
  }
}
