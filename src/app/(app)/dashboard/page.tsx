import { getUser } from '@/lib/auth';
import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { clients } from '@/lib/data';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) return null;

  return (
    <div className="flex-1 space-y-4">
      {user.role !== 'client' && <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>}
      {user.role === 'admin' && <AdminDashboard clients={clients} />}
      {user.role === 'team' && <TeamDashboard user={user} />}
      {user.role === 'client' && <ClientDashboard user={user} />}
    </div>
  );
}
