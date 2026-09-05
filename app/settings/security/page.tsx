import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PasswordForm from '@/components/PasswordForm';
import { requireUser } from '@/lib/auth';
import { t } from '@/lib/i18n';

export default async function SecurityPage() {
  const user = await requireUser();
  const tr = (key: string) => t(user.preferredLanguage, key);

  return <div className="appShell"><Sidebar/><main className="main"><Topbar/><section className="content">
    <div className="pageHeader"><div><h1>{tr('Security')}</h1><p>{tr('Manage your account password.')}</p></div></div>
    <div className="card"><div className="cardHeader"><strong>{tr('Change password')}</strong></div><PasswordForm/></div>
  </section></main></div>;
}
