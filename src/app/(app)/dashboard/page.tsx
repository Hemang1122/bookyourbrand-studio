import { getUser } from '@/lib/auth';
import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { projects, tasks, clients } from '@/lib/data';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) return null;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      {user.role === 'admin' && <AdminDashboard projects={projects} tasks={tasks} clients={clients} />}
      {user.role === 'team' && <TeamDashboard user={user} projects={projects} tasks={tasks} />}
      {user.role === 'client' && <ClientDashboard user={user} projects={projects} tasks={tasks} />}
    </div>
  );
}
