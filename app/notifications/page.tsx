import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  const unread = notifications.filter((item) => !item.readAt).length;
  return <div className="appShell"><Sidebar /><main className="main"><Topbar title="Notifications" /><section className="content"><div className="pageHeader"><div><h1>Notifications</h1><p>Updates about requests, documents and compliance.</p></div><form action="/api/notifications" method="post"><button className="secondaryButton" type="submit">Mark all as read</button></form></div><div className="card"><div className="cardHeader"><strong>{unread} unread</strong></div>{notifications.length === 0 ? <p className="muted">No notifications yet.</p> : <div className="list">{notifications.map((item) => <div className={`listRow ${item.readAt ? '' : 'unread'}`} key={item.id}><div><strong>{item.title}</strong><p>{item.message}</p></div><small>{item.createdAt.toLocaleString()}</small></div>)}</div>}</div></section></main></div>;
}
