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

  const adminToken = await createSessionToken(admins[0].id);
  const session = await verifySessionToken(adminToken);
  if (!session || session.sub !== admins[0].id) throw new Error('Valid session token was not accepted.');
  if (await verifySessionToken(`${adminToken}tampered`)) throw new Error('Tampered session token was accepted.');

  const firstCompanyUser = companyUsers[0];
  const otherCompany = companies.find(c => c.id !== firstCompanyUser.companyId);
  if (!firstCompanyUser.companyId || !otherCompany) throw new Error('Could not establish company isolation test.');
  if (!canAccessCompany(firstCompanyUser, firstCompanyUser.companyId)) throw new Error('Company user cannot access own company.');
  if (canAccessCompany(firstCompanyUser, otherCompany.id)) throw new Error('Company user can access another company.');
  if (!canAccessCompany(admins[0], otherCompany.id) || !canAccessCompany(staff[0], otherCompany.id)) throw new Error('Expoline staff roles lost cross-company access.');

  console.log('AUTH SMOKE TEST PASSED');
  console.log(`Verified ${users.length} active demo users, ${companies.length} companies, password hashing, signed sessions, tamper rejection, and company isolation.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
