import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const personnel = await prisma.personnel.findMany({ include: { company: true }, orderBy: { fullName: 'asc' } });
  return NextResponse.json(personnel);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.fullName?.trim() || !body.companyName?.trim()) return NextResponse.json({ error: 'Full name and company are required.' }, { status: 400 });
    const company = await prisma.company.findFirst({ where: { name: body.companyName.trim() } });
    if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    const statusMap: Record<string, 'CANDIDATE'|'RECRUITING'|'PROCESSING'|'ACTIVE'|'INACTIVE'> = { Candidate:'CANDIDATE', Recruiting:'RECRUITING', Processing:'PROCESSING', Active:'ACTIVE', Inactive:'INACTIVE' };
    const personnel = await prisma.personnel.create({ data: {
      companyId: company.id,
      fullName: body.fullName.trim(),
      chineseName: body.chineseName?.trim() || null,
      nationality: body.nationality?.trim() || null,
      position: body.position?.trim() || null,
      passportNumber: body.passportNumber?.trim() || null,
      passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
      status: statusMap[body.status] ?? 'CANDIDATE',
    }, include: { company: true } });
    return NextResponse.json(personnel, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to save personnel.' }, { status: 500 });
  }
}
