import { PrismaClient, RecordStatus, RequestPriority, RequestStatus, PersonnelStatus, Role, DocumentCategory } from "@prisma/client";

const prisma = new PrismaClient();
const daysFromNow = (days: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + days); return d; };
const dateOnly = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

async function main() {
  console.log("Seeding SYNTHETIC Expoline test data only...");
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.insuranceRecord.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.workPermit.deleteMany();
  await prisma.visa.deleteMany();
  await prisma.document.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const admin = await prisma.user.create({ data: { name: "Expoline Demo Admin", email: "admin@demo.expoline.example", role: Role.SUPER_ADMIN, preferredLanguage: "en" } });
  const staff = await prisma.user.create({ data: { name: "Expoline Demo Staff", email: "staff@demo.expoline.example", role: Role.EXPOLINE_STAFF, preferredLanguage: "en" } });

  const companySeed = [
    ["Pacific Horizon Construction Ltd. (Demo)", "TEST-COMP-001", "Demo Industrial Zone, Malé", "hr@pacifichorizon.example", "+960 7000001", "en"],
    ["Blue Lagoon Hospitality Group (Demo)", "TEST-COMP-002", "Demo Resort District, Malé", "hr@bluelagoon.example", "+960 7000002", "en"],
    ["Golden Bridge Trading & Services (Demo)", "TEST-COMP-003", "Demo Commercial Area, Malé", "hr@goldenbridge.example", "+960 7000003", "zh"],
    ["Island Engineering Solutions (Demo)", "TEST-COMP-004", "Demo Engineering Park, Hulhumalé", "hr@islandengineering.example", "+960 7000004", "en"],
  ] as const;
  const companies: Array<{ id: string; name: string; language: string }> = [];
  const companyUsers = [] as Array<{ id: string; companyId: string; role: Role }>;

  for (const [name, registrationNumber, address, contactEmail, contactPhone, language] of companySeed) {
    // language belongs to users, not Company in the current Prisma schema.
    const company = await prisma.company.create({ data: { name, registrationNumber, address, contactEmail, contactPhone } });
    companies.push({ id: company.id, name: company.name, language });
    for (const [suffix, role] of [["HR Manager", Role.COMPANY_HR_MANAGER], ["HR User", Role.COMPANY_HR_USER], ["HR Assistant", Role.COMPANY_HR_USER]] as const) {
      const user = await prisma.user.create({ data: { name: `${name.split(" (Demo)")[0]} ${suffix}`, email: `${suffix === "HR Manager" ? "manager" : suffix === "HR User" ? "hr" : "assistant"}-${company.id}@demo.expoline.example`, role, companyId: company.id, preferredLanguage: language } });
      companyUsers.push({ id: user.id, companyId: company.id, role });
    }
  }

  const firstNames = ["Chen Wei","Li Jun","Wang Lei","Zhang Hao","Liu Ming","Arun Kumar","Rahul Sharma","Vikram Singh","Amit Patel","Ravi Das","Daniel Tan","Kevin Lim","Michael Wong","Jason Lee","Andrew Koh","Ahmed Hassan","Omar Ali","Yusuf Ibrahim","Samir Khan","Faisal Noor","David Chen","Steven Wu","Peter Zhang","Jason Huang","Eric Lin","Sanjay Rao","Manoj Nair","Deepak Verma","Kiran Joshi","Rakesh Mehta","Mohamed Salim","Ibrahim Latheef","Adam Shareef","Hussain Rasheed","Ismail Naseer"];
  const positions = ["General Worker","Technician","Electrician","Plumber","Welder","Kitchen Assistant","Housekeeping Supervisor","Maintenance Technician","Site Supervisor","Storekeeper"];
  const nationalities = ["China","India","Bangladesh","Sri Lanka","Nepal"];
  const personnel: Array<{ id: string; companyId: string; fullName: string }> = [];

  for (let i = 0; i < 35; i++) {
    const company = companies[i % companies.length];
    const person = await prisma.personnel.create({ data: {
      companyId: company.id,
      fullName: `${firstNames[i]} (Test ${String(i + 1).padStart(3, "0")})`,
      chineseName: i % 3 === 0 ? `测试人员${i + 1}` : null,
      nationality: nationalities[i % nationalities.length],
      passportNumber: `TEST-PASSPORT-${String(i + 1).padStart(3, "0")}`,
      passportExpiry: daysFromNow(i % 7 === 0 ? 45 : 300 + i * 11),
      dateOfBirth: dateOnly(`1990-${String((i % 12) + 1).padStart(2, "0")}-15`),
      position: positions[i % positions.length],
      status: i < 5 ? PersonnelStatus.CANDIDATE : i < 10 ? PersonnelStatus.PROCESSING : i === 30 ? PersonnelStatus.INACTIVE : PersonnelStatus.ACTIVE,
    } });
    personnel.push({ id: person.id, companyId: person.companyId, fullName: person.fullName });

    const expiryFor = (status: RecordStatus, validDays: number, soonDays: number) => status === RecordStatus.EXPIRED ? daysFromNow(-20 - i) : status === RecordStatus.EXPIRING_SOON ? daysFromNow(soonDays) : daysFromNow(validDays);
    const visaStatus = i % 9 === 0 ? RecordStatus.EXPIRED : i % 5 === 0 ? RecordStatus.EXPIRING_SOON : i % 8 === 0 ? RecordStatus.PENDING : RecordStatus.VALID;
    const workStatus = i % 10 === 0 ? RecordStatus.EXPIRED : i % 6 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;
    const medicalStatus = i % 11 === 0 ? RecordStatus.EXPIRED : i % 4 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;
    const insuranceStatus = i % 13 === 0 ? RecordStatus.EXPIRED : i % 7 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;

    await prisma.visa.create({ data: { personnelId: person.id, visaNumber: `TEST-VISA-${String(i + 1).padStart(3, "0")}`, visaType: i % 2 ? "Work Visa" : "Employment Visa", issueDate: daysFromNow(-240), expiryDate: expiryFor(visaStatus, 240, 18), status: visaStatus } });
    await prisma.workPermit.create({ data: { personnelId: person.id, permitNumber: `TEST-WP-${String(i + 1).padStart(3, "0")}`, permitType: "Employment Permit", issueDate: daysFromNow(-200), expiryDate: expiryFor(workStatus, 260, 25), status: workStatus } });
    await prisma.medicalRecord.create({ data: { personnelId: person.id, medicalType: "Pre-employment Medical", completionDate: daysFromNow(-100), expiryDate: expiryFor(medicalStatus, 180, 30), status: medicalStatus } });
    await prisma.insuranceRecord.create({ data: { personnelId: person.id, provider: "Demo Insurance Provider", policyNumber: `TEST-POLICY-${String(i + 1).padStart(3, "0")}`, coverageType: "Employee Medical & Accident", startDate: daysFromNow(-120), expiryDate: expiryFor(insuranceStatus, 240, 21), status: insuranceStatus } });

    if (i % 2 === 0) await prisma.document.create({ data: { companyId: company.id, personnelId: person.id, category: DocumentCategory.PASSPORT, name: `TEST Passport - ${person.fullName}`, storageKey: `demo/personnel/${person.id}/passport-test.pdf`, mimeType: "application/pdf", sizeBytes: 125000, expiryDate: person.passportExpiry, status: RecordStatus.VALID, uploadedById: staff.id } });
    if (i % 3 === 0) await prisma.document.create({ data: { companyId: company.id, personnelId: person.id, category: DocumentCategory.EMPLOYMENT, name: `TEST Employment Contract - ${person.fullName}`, storageKey: `demo/personnel/${person.id}/employment-test.pdf`, mimeType: "application/pdf", sizeBytes: 210000, status: RecordStatus.VALID, uploadedById: staff.id } });
  }

  const templates = [
    ["New employee document submission", "Please upload the remaining employment documents.", RequestPriority.NORMAL, RequestStatus.PENDING],
    ["Visa renewal follow-up", "Demo request for a visa approaching expiry.", RequestPriority.HIGH, RequestStatus.UNDER_REVIEW],
    ["Medical appointment confirmation", "Please confirm the medical appointment date.", RequestPriority.URGENT, RequestStatus.SUBMITTED],
    ["Insurance document update", "Please provide the updated demo insurance certificate.", RequestPriority.NORMAL, RequestStatus.APPROVED],
    ["Work permit correction", "Demo correction request for work permit information.", RequestPriority.HIGH, RequestStatus.REVISION_REQUIRED],
    ["Candidate processing status", "Please confirm whether this candidate should proceed.", RequestPriority.LOW, RequestStatus.PENDING],
  ] as const;
  for (let i = 0; i < 18; i++) {
    const person = personnel[i % personnel.length];
    const creator = companyUsers.find((u) => u.companyId === person.companyId)!;
    const t = templates[i % templates.length];
    await prisma.request.create({ data: { companyId: person.companyId, personnelId: person.id, title: `${t[0]} - ${person.fullName}`, description: t[1], priority: t[2], dueDate: daysFromNow(3 + i % 12), status: t[3], createdById: creator.id } });
  }

  for (const [i, user] of [admin, staff, ...companyUsers.slice(0, 6)].entries()) await prisma.notification.create({ data: { userId: user.id, title: i % 2 ? "Demo request update" : "Demo expiry alert", message: i % 2 ? "A synthetic client request has been updated for testing." : "A synthetic compliance record is approaching expiry.", type: i % 2 ? "REQUEST" : "COMPLIANCE", readAt: i % 3 === 0 ? null : daysFromNow(-1) } });

  console.log("Synthetic test dataset ready:", {
    companies: await prisma.company.count(), users: await prisma.user.count(), personnel: await prisma.personnel.count(), documents: await prisma.document.count(),
    visas: await prisma.visa.count(), workPermits: await prisma.workPermit.count(), medical: await prisma.medicalRecord.count(), insurance: await prisma.insuranceRecord.count(),
    requests: await prisma.request.count(), notifications: await prisma.notification.count()
  });
  console.log("No real client data is included. All identifiers use TEST-/demo.example values.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
