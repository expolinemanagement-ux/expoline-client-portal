import { notFound } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import CompanyEditForm from '../../../components/CompanyEditForm';
import { prisma } from '../../../lib/prisma';

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      personnel: { orderBy: { createdAt: 'desc' } },
      requests: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { users: true, personnel: true, requests: true, documents: true } },
    },
  });
  if (!company) notFound();

  return <div className='appShell'><Sidebar/><main className='main'><Topbar/><section className='content'>
    <div className='pageHeading'><div><a href='/companies'>← Companies</a><h1>{company.name}</h1><p>Client company profile and portal activity</p></div></div>
    <section className='statsGrid'>
      <div className='statCard'><span>HR users</span><strong>{company._count.users}</strong></div>
      <div className='statCard'><span>Personnel</span><strong>{company._count.personnel}</strong></div>
      <div className='statCard'><span>Requests</span><strong>{company._count.requests}</strong></div>
      <div className='statCard'><span>Documents</span><strong>{company._count.documents}</strong></div>
    </section>
    <section className='panel'><h2>Company details</h2><CompanyEditForm company={company}/></section>
    <section className='panel'><h2>HR users</h2><table className='dataTable'><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Language</th><th>Status</th></tr></thead><tbody>{company.users.map(u=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td><td>{u.preferredLanguage === 'zh' ? 'Chinese' : 'English'}</td><td>{u.active ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></section>
    <section className='panel'><h2>Personnel</h2><table className='dataTable'><thead><tr><th>Name</th><th>Position</th><th>Status</th></tr></thead><tbody>{company.personnel.map(p=><tr key={p.id}><td><a href={`/personnel/${p.id}`}><b>{p.fullName}</b></a></td><td>{p.position || '—'}</td><td>{p.status}</td></tr>)}</tbody></table></section>
    <section className='panel'><h2>Recent requests</h2><table className='dataTable'><thead><tr><th>Request</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>{company.requests.map(r=><tr key={r.id}><td>{r.title}</td><td>{r.priority}</td><td>{r.status}</td><td>{r.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table></section>
  </section></main></div>;
}
