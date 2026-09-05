import { PrismaClient, RecordStatus, RequestPriority, RequestStatus, PersonnelStatus, Role, DocumentCategory } from "@prisma/client";

const prisma = new PrismaClient();

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const dateOnly = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

async function main() {
  console.log("Seeding SYNTHETIC Expoline test data only...");

  // This seed is intentionally destructive. It is for the local/test database only.
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.insuranceRecord.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.workPermit.deleteMany();
  await prisma.visa.deleteMany();
  await prisma.document.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const expolineAdmin = await prisma.user.create({
    data: {
      name: "Expoline Demo Admin",
      email: "admin@demo.expoline.example",
      role: Role.SUPER_ADMIN,
      preferredLanguage: "en",
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: "Expoline Demo Staff",
      email: "staff@demo.expoline.example",
      role: Role.EXPOLINE_STAFF,
      preferredLanguage: "en",
    },
  });

  const companySeed = [
    {
      name: "Pacific Horizon Construction Ltd. (Demo)",
      registrationNumber: "TEST-COMP-001",
      address: "Demo Industrial Zone, Malé",
      contactEmail: "hr@pacifichorizon.example",
      contactPhone: "+960 7000001",
      language: "en",
    },
    {
      name: "Blue Lagoon Hospitality Group (Demo)",
      registrationNumber: "TEST-COMP-002",
      address: "Demo Resort District, Malé",
      contactEmail: "hr@bluelagoon.example",
      contactPhone: "+960 7000002",
      language: "en",
    },
    {
      name: "Golden Bridge Trading & Services (Demo)",
      registrationNumber: "TEST-COMP-003",
      address: "Demo Commercial Area, Malé",
      contactEmail: "hr@goldenbridge.example",
      contactPhone: "+960 7000003",
      language: "zh",
    },
    {
      name: "Island Engineering Solutions (Demo)",
      registrationNumber: "TEST-COMP-004",
      address: "Demo Engineering Park, Hulhumalé",
      contactEmail: "hr@islandengineering.example",
      contactPhone: "+960 7000004",
      language: "en",
    },
  ];

  const companies = [] as Array<{ id: string; name: string; language: string }>;
  for (const item of companySeed) {
    const company = await prisma.company.create({ data: item });
    companies.push(company);

    await prisma.user.create({
      data: {
        name: `${company.name.split(" (Demo)")[0]} HR Manager`,
        email: `manager-${company.id}@demo.expoline.example`,
        role: Role.COMPANY_HR_MANAGER,
        companyId: company.id,
        preferredLanguage: company.language,
      },
    });

    await prisma.user.create({
      data: {
        name: `${company.name.split(" (Demo)")[0]} HR User`,
        email: `hr-${company.id}@demo.expoline.example`,
        role: Role.COMPANY_HR_USER,
        companyId: company.id,
        preferredLanguage: company.language,
      },
    });

    await prisma.user.create({
      data: {
        name: `${company.name.split(" (Demo)")[0]} HR Assistant`,
        email: `assistant-${company.id}@demo.expoline.example`,
        role: Role.COMPANY_HR_USER,
        companyId: company.id,
        preferredLanguage: company.language,
      },
    });
  }

  const firstNames = [
    "Chen Wei", "Li Jun", "Wang Lei", "Zhang Hao", "Liu Ming",
    "Arun Kumar", "Rahul Sharma", "Vikram Singh", "Amit Patel", "Ravi Das",
    "Daniel Tan", "Kevin Lim", "Michael Wong", "Jason Lee", "Andrew Koh",
    "Ahmed Hassan", "Omar Ali", "Yusuf Ibrahim", "Samir Khan", "Faisal Noor",
    "David Chen", "Steven Wu", "Peter Zhang", "Jason Huang", "Eric Lin",
    "Sanjay Rao", "Manoj Nair", "Deepak Verma", "Kiran Joshi", "Rakesh Mehta",
    "Mohamed Salim", "Ibrahim Latheef", "Adam Shareef", "Hussain Rasheed", "Ismail Naseer",
  ];

  const positions = [
    "General Worker", "Technician", "Electrician", "Plumber", "Welder",
    "Kitchen Assistant", "Housekeeping Supervisor", "Maintenance Technician",
    "Site Supervisor", "Storekeeper",
  ];

  const nationalities = ["China", "India", "Bangladesh", "Sri Lanka", "Nepal"];
  const personnel = [] as Array<{ id: string; companyId: string; fullName: string; position: string; index: number }>;

  for (let i = 0; i < 35; i++) {
    const company = companies[i % companies.length];
    const name = firstNames[i];
    const status = i < 5 ? PersonnelStatus.CANDIDATE : i < 10 ? PersonnelStatus.PROCESSING : i === 30 ? PersonnelStatus.INACTIVE : PersonnelStatus.ACTIVE;
    const person = await prisma.personnel.create({
      data: {
        companyId: company.id,
        fullName: `${name} (Test ${String(i + 1).padStart(3, "0")})`,
        chineseName: i % 3 === 0 ? `测试人员${i + 1}` : null,
        nationality: nationalities[i % nationalities.length],
        passportNumber: `TEST-PASSPORT-${String(i + 1).padStart(3, "0")}`,
        passportExpiry: daysFromNow(i % 7 === 0 ? 45 : 300 + (i * 11)),
        dateOfBirth: dateOnly(`1990-${String((i % 12) + 1).padStart(2, "0")}-15`),
        position: positions[i % positions.length],
        status,
      },
    });
    personnel.push({ id: person.id, companyId: person.companyId, fullName: person.fullName, position: person.position ?? "Worker", index: i });

    const visaStatus = i % 9 === 0 ? RecordStatus.EXPIRED : i % 5 === 0 ? RecordStatus.EXPIRING_SOON : i % 8 === 0 ? RecordStatus.PENDING : RecordStatus.VALID;
    const workPermitStatus = i % 10 === 0 ? RecordStatus.EXPIRED : i % 6 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;
    const medicalStatus = i % 11 === 0 ? RecordStatus.EXPIRED : i % 4 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;
    const insuranceStatus = i % 13 === 0 ? RecordStatus.EXPIRED : i % 7 === 0 ? RecordStatus.EXPIRING_SOON : RecordStatus.VALID;

    const expiryFor = (status: RecordStatus, validDays: number, expiringDays: number) =>
      status === RecordStatus.EXPIRED ? daysFromNow(-20 - i) : status === RecordStatus.EXPIRING_SOON ? daysFromNow(expiringDays) : daysFromNow(validDays);

    await prisma.visa.create({
      data: {
        personnelId: person.id,
        visaNumber: `TEST-VISA-${String(i + 1).padStart(3, "0")}`,
        visaType: i % 2 === 0 ? "Employment Visa" : "Work Visa",
        issueDate: daysFromNow(-240),
        expiryDate: expiryFor(visaStatus, 240, 18),
        status: visaStatus,
        notes: visaStatus === RecordStatus.EXPIRING_SOON ? "Demo record: renewal action should be raised." : undefined,
      },
    });

    await prisma.workPermit.create({
      data: {
        personnelId: person.id,
        permitNumber: `TEST-WP-${String(i + 1).padStart(3, "0")}`,
        permitType: "Employment Permit",
        issueDate: daysFromNow(-200),
        expiryDate: expiryFor(workPermitStatus, 260, 25),
        status: workPermitStatus,
      },
    });

    await prisma.medicalRecord.create({
      data: {
        personnelId: person.id,
        medicalType: "Pre-employment Medical",
        completionDate: daysFromNow(-100),
        expiryDate: expiryFor(medicalStatus, 180, 30),
        status: medicalStatus,
      },
    });

    await prisma.insuranceRecord.create({
      data: {
        personnelId: person.id,
        provider: "Demo Insurance Provider",
        policyNumber: `TEST-POLICY-${String(i + 1).padStart(3, "0")}`,
        coverageType: "Employee Medical & Accident",
        startDate: daysFromNow(-120),
        expiryDate: expiryFor(insuranceStatus, 240, 21),
        status: insuranceStatus,
      },
    });

    if (i % 2 === 0) {
      await prisma.document.create({
        data: {
          companyId: person.companyId,
          personnelId: person.id,
          category: DocumentCategory.PASSPORT,
          name: `TEST Passport - ${person.fullName}`,
          storageKey: `demo/personnel/${person.id}/passport-test.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 125000,
          issueDate: daysFromNow(-600),
          expiryDate: person.passportExpiry,
          status: RecordStatus.VALID,
          uploadedById: staff.id,
        },
      });
    }

    if (i % 3 === 0) {
      await prisma.document.create({
        data: {
          companyId: person.companyId,
          personnelId: person.id,
          category: DocumentCategory.EMPLOYMENT,
          name: `TEST Employment Contract - ${person.fullName}`,
          storageKey: `demo/personnel/${person.id}/employment-test.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 210000,
          status: RecordStatus.VALID,
          uploadedById: staff.id,
        },
      });
    }
  }

  const companyUsers = await prisma.user.findMany({
    where: { role: { in: [Role.COMPANY_HR_MANAGER, Role.COMPANY_HR_USER] } },
    orderBy: { createdAt: "asc" },
  });

  const requestTemplates = [
    ["New employee document submission", "Please upload the remaining employment documents for the new worker.", RequestPriority.NORMAL, RequestStatus.PENDING],
    ["Visa renewal follow-up", "Demo request for a visa approaching expiry.", RequestPriority.HIGH, RequestStatus.UNDER_REVIEW],
    ["Medical appointment confirmation", "Please confirm the medical appointment date for this employee.", RequestPriority.URGENT, RequestStatus.SUBMITTED],
    ["Insurance document update", "Please provide the updated demo insurance certificate.", RequestPriority.NORMAL, RequestStatus.APPROVED],
    ["Work permit correction", "Demo correction request for work permit information.", RequestPriority.HIGH, RequestStatus.REVISION_REQUIRED],
    ["Candidate processing status", "Please confirm whether this candidate should proceed to the next stage.", RequestPriority.LOW, RequestStatus.PENDING],
  ] as const;

  for (let i = 0; i < 18; i++) {
    const person = personnel[i % personnel.length];
    const company = companies.find((item) => item.id === person.companyId)!;
    const creator = companyUsers.find((user) => user.companyId === company.id) ?? companyUsers[0];
    const template = requestTemplates[i % requestTemplates.length];
    await prisma.request.create({
      data: {
        companyId: company.id,
        personnelId: person.id,
        title: `${template[0]} - ${person.fullName}`,
        description: template[1],
        priority: template[2],
        dueDate: daysFromNow(3 + (i % 12)),
        status: template[3],
        createdById: creator.id,
      },
    });
  }

  const notificationUsers = [expolineAdmin, staff, ...companyUsers.slice(0, 6)];
  for (let i = 0; i < notificationUsers.length; i++) {
    const user = notificationUsers[i];
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: i % 2 === 0 ? "Demo expiry alert" : "Demo request update",
        message: i % 2 === 0 ? "A synthetic compliance record is approaching expiry. Review the Compliance page." : "A synthetic client request has been updated for testing.",
        type: i % 2 === 0 ? "COMPLIANCE" : "REQUEST",
        readAt: i % 3 === 0 ? null : daysFromNow(-1),
      },
    });
  }

  const counts = {
    companies: await prisma.company.count(),
    users: await prisma.user.count(),
    personnel: await prisma.personnel.count(),
    documents: await prisma.document.count(),
    visas: await prisma.visa.count(),
    workPermits: await prisma.workPermit.count(),
    medical: await prisma.medicalRecord.count(),
    insurance: await prisma.insuranceRecord.count(),
    requests: await prisma.request.count(),
    notifications: await prisma.notification.count(),
  };

  console.log("Synthetic test dataset ready:", counts);
  console.log("No real client data is included. All identifiers use TEST-/demo.example values.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
