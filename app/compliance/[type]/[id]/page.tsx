import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ComplianceEditForm from '@/components/ComplianceEditForm';
import { prisma } from '@/lib/prisma';
import { canAccessCompany, requireUser } from '@/lib/auth';

export default async function ComplianceDetail({ params }: { params: Promise<{ type: string; id: string }> }) {
  const user = await requireUser();
  const { type, id } = await params;
  const models: Record<string, any> = {
    visa: prisma.visa,
    'work-permit': prisma.workPermit,
    medical: prisma.medicalRecord,
    insurance: prisma.insuranceRecord,
  };
  const model = models[type];

  if (!model) {
    return <div>Invalid record type.</div>;
  }

  const record = await model.findUnique({ where: { id }, include: { personnel: true } });
  if (!record || !canAccessCompany(user, record.personnel.companyId)) {
    return (
      <div className="appShell">
        <Sidebar />
        <main className="main">
          <Topbar />
          <section className="content">
            <h1>Record not found</h1>
            <a href="/compliance">Back to Compliance</a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="appShell">
      <Sidebar />
      <main className="main">
        <Topbar />
        <section className="content">
          <div className="pageHeading">
            <div>
              <h1>{type.replaceAll('-', ' ')} record</h1>
              <p>TEST compliance record for {record.personnel.fullName}</p>
            </div>
            <a href="/compliance">← Back to Compliance</a>
          </div>
          <section className="panel">
            <ComplianceEditForm type={type} id={id} record={record} />
          </section>
        </section>
      </main>
    </div>
  );
}
