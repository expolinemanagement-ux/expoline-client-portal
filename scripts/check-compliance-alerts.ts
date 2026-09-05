import { PrismaClient, RecordStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DAYS_AHEAD = 30;

function classify(expiryDate: Date | null) {
  if (!expiryDate) return null;
  const now = new Date();
  const cutoff = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
  if (expiryDate < now) return RecordStatus.EXPIRED;
  if (expiryDate <= cutoff) return RecordStatus.EXPIRING_SOON;
  return RecordStatus.VALID;
}

async function notify(companyId: string, title: string, message: string) {
  const recipients = await prisma.user.findMany({
    where: {
      active: true,
      OR: [
        { companyId, role: { in: ['COMPANY_HR_MANAGER', 'COMPANY_HR_USER'] } },
        { role: { in: ['SUPER_ADMIN', 'EXPOLINE_STAFF'] } },
      ],
    },
    select: { id: true },
  });
  if (!recipients.length) return;
  const existing = await prisma.notification.findMany({
    where: { userId: { in: recipients.map(r => r.id) }, type: 'COMPLIANCE_EXPIRY', message, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    select: { userId: true },
  });
  const seen = new Set(existing.map(x => x.userId));
  const data = recipients.filter(r => !seen.has(r.id)).map(r => ({ userId: r.id, title, message, type: 'COMPLIANCE_EXPIRY' }));
  if (data.length) await prisma.notification.createMany({ data });
}

async function main() {
  let alerts = 0;
  const now = new Date();
  const cutoff = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

  const personnel = await prisma.personnel.findMany({ select: { id: true, fullName: true, companyId: true, passportExpiry: true } });
  for (const person of personnel) {
    const status = classify(person.passportExpiry);
    if (!status) continue;
    await prisma.personnel.update({ where: { id: person.id }, data: {} });
    if (status === RecordStatus.EXPIRED || status === RecordStatus.EXPIRING_SOON) {
      const label = status === RecordStatus.EXPIRED ? 'expired' : 'expires within 30 days';
      await notify(person.companyId, `Passport alert: ${person.fullName}`, `${person.fullName}'s passport ${label} (${person.passportExpiry!.toISOString().slice(0,10)}).`);
      alerts++;
    }
  }

  const [visas, permits, medical, insurance, documents] = await Promise.all([
    prisma.visa.findMany({ where: { expiryDate: { not: null, lte: cutoff } }, include: { personnel: { select: { fullName: true, companyId: true } } } }),
    prisma.workPermit.findMany({ where: { expiryDate: { not: null, lte: cutoff } }, include: { personnel: { select: { fullName: true, companyId: true } } } }),
    prisma.medicalRecord.findMany({ where: { expiryDate: { not: null, lte: cutoff } }, include: { personnel: { select: { fullName: true, companyId: true } } } }),
    prisma.insuranceRecord.findMany({ where: { expiryDate: { not: null, lte: cutoff } }, include: { personnel: { select: { fullName: true, companyId: true } } } }),
    prisma.document.findMany({ where: { expiryDate: { not: null, lte: cutoff } }, include: { personnel: { select: { fullName: true, companyId: true } } } }),
  ]);

  const groups = [
    ['Visa', visas], ['Work permit', permits], ['Medical', medical], ['Insurance', insurance], ['Document', documents],
  ] as const;
  for (const [label, records] of groups) {
    for (const record of records) {
      const status = classify(record.expiryDate);
      if (!status || !record.personnel) continue;
      const state = status === RecordStatus.EXPIRED ? 'expired' : 'expires within 30 days';
      await notify(record.personnel.companyId, `${label} alert: ${record.personnel.fullName}`, `${record.personnel.fullName}'s ${label.toLowerCase()} ${state} (${record.expiryDate!.toISOString().slice(0,10)}).`);
      alerts++;
    }
  }
  console.log(`Compliance alert check complete. ${alerts} records require attention.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
