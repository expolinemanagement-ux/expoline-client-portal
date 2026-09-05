import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    const company = await prisma.company.create({ data: {
      name: body.name.trim(),
      registrationNumber: body.registrationNumber?.trim() || null,
      address: body.address?.trim() || null,
      contactEmail: body.contactEmail?.trim() || null,
      contactPhone: body.contactPhone?.trim() || null,
    }});
    return NextResponse.json(company, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to save company.' }, { status: 500 });
  }
}
