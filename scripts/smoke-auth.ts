import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, verifyPassword } from '../lib/password';
import { canAccessCompany, createSessionToken, verifySessionToken } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.DEMO_PASSWORD || 'Demo123!';
  const users = await prisma.user.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
  const companies = await prisma.company.findMany({ orderBy: { createdAt: 'asc' } });

  if (companies.length !== 4) throw new Error(`Expected 4 demo companies, found ${companies.length}.`);
  if (users.length !== 14) throw new Error(`Expected 14 active demo users, found ${users.length}.`);

  const admins = users.filter(u => u.role === Role.SUPER_ADMIN);
  const staff = users.filter(u => u.role === Role.EXPOLINE_STAFF);
  const companyUsers = users.filter(u => u.role === Role.COMPANY_HR_MANAGER || u.role === Role.COMPANY_HR_USER);
  if (admins.length !== 1 || staff.length !== 1 || companyUsers.length !== 12) throw new Error('Unexpected demo role counts.');
  if (companies.some(c => users.filter(u => u.companyId === c.id).length !== 3)) throw new Error('Each company must have exactly 3 HR demo users.');

  for (const user of users) {
    if (!(await verifyPassword(password, user.passwordHash))) throw new Error(`Demo password verification failed for ${user.email}.`);
  }
  if (await verifyPassword('definitely-wrong', admins[0].passwordHash)) throw new Error('Incorrect password was accepted.');

  const generatedHash = await hashPassword(password);
  if (!(await verifyPassword(password, generatedHash))) throw new Error('Fresh password hash verification failed.');

  const adminToken = await createSessionToken(admins[0].id);
  const session = await verifySessionToken(adminToken);
  if (!session || session.sub !== admins[0].id) throw new Error('Valid session token was not accepted.');
  if (await verifySessionToken(`${adminToken}tampered`)) throw new Error('Tampered session token was accepted.');

  const companyIds = new Set(companies.map(c => c.id));
  for (const user of companyUsers) {
    if (!user.companyId || !companyIds.has(user.companyId)) throw new Error(`Company HR user ${user.email} has an invalid company assignment.`);
    for (const company of companies) {
      const expected = company.id === user.companyId;
      if (canAccessCompany(user, company.id) !== expected) {
        throw new Error(`Company isolation failed for ${user.email} against company ${company.id}.`);
      }
    }
  }

  for (const company of companies) {
    if (!canAccessCompany(admins[0], company.id)) throw new Error('SUPER_ADMIN lost cross-company access.');
    if (!canAccessCompany(staff[0], company.id)) throw new Error('EXPOLINE_STAFF lost cross-company access.');
  }

  console.log('AUTH SMOKE TEST PASSED');
  console.log(`Verified ${users.length} active demo users, ${companies.length} companies, password hashing, signed sessions, tamper rejection, and full company isolation matrix.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
