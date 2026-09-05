import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.personnel.findUnique({ where: { id }, include: { company: true, visas: true, workPermits: true, medicalRecords: true, insuranceRecords: true, documents: true } });
  if (!item) return NextResponse.json({ error: 'Personnel not found.' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const body = await request.json();
    const statusMap: Record<string, 'CANDIDATE'|'RECRUITING'|'PROCESSING'|'ACTIVE'|'INACTIVE'> = { Candidate:'CANDIDATE', Recruiting:'RECRUITING', Processing:'PROCESSING', Active:'ACTIVE', Inactive:'INACTIVE' };
    const company = body.companyName ? await prisma.company.findFirst({ where: { name: body.companyName.trim() } }) : null;
    const item = await prisma.personnel.update({ where: { id }, data: { fullName: body.fullName?.trim(), chineseName: body.chineseName?.trim() || null, nationality: body.nationality?.trim() || null, position: body.position?.trim() || null, passportNumber: body.passportNumber?.trim() || null, passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null, status: statusMap[body.status] ?? 'CANDIDATE', ...(company ? { companyId: company.id } : {}) } });
    return NextResponse.json(item);
  } catch { return NextResponse.json({ error: 'Unable to update personnel.' }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await prisma.personnel.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: 'Unable to delete personnel.' }, { status: 500 }); }
}
