import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { t } from '../../lib/i18n';

export default async function AuditPage() {
  const user = await requireUser();
  const isExpoline = user.role === 'SUPER_ADMIN' || user.role === 'EXPOLINE_STAFF';
  const logs = await prisma.auditLog.findMany({
    where: isExpoline ? {} : { companyId: user.companyId || '__none__' },
    include: { user: { select: { name: true, email: true } }, company: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const tr = (key: string) => t(user.preferredLanguage, key);
  return <div className="appShell"><Sidebar/><main className="main"><Topbar/><section className="content">
    <div className="pageHeader"><div><h1>{tr('Audit Log')}</h1><p>{tr('Recent activity and changes')}</p></div></div>
    <div className="card"><div className="tableWrap"><table><thead><tr><th>{tr('Date')}</th><th>{tr('User')}</th><th>{tr('Company')}</th><th>{tr('Action')}</th><th>{tr('Entity')}</th><th>{tr('Details')}</th></tr></thead>
    <tbody>{logs.length===0?<tr><td colSpan={6} className="muted">{tr('No audit events yet.')}</td></tr>:logs.map(log=><tr key={log.id}><td>{log.createdAt.toLocaleString(user.preferredLanguage==='zh'?'zh-CN':'en-US')}</td><td>{log.user?.name || tr('System')}</td><td>{log.company?.name || '—'}</td><td><strong>{log.action}</strong></td><td>{log.entityType}{log.entityId?` · ${log.entityId}`:''}</td><td>{log.details||'—'}</td></tr>)}</tbody></table></div></div>
  </section></main></div>;
}
