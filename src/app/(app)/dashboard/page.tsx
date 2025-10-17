
'use client';

import { useAuth } from '@/lib/auth-client';
import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { clients } from '@/lib/data';
import { useData } from '../data-provider';


export default function DashboardPage() {
  const { user } = useAuth();
  const { clients } = useData();

  if (!user) return (
     <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
        </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-4">
      {user.role === 'admin' && (
         <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
         </div>
      )}
      {user.role === 'admin' && <AdminDashboard clients={clients} />}
      {user.role === 'team' && <TeamDashboard user={user} />}
      {user.role === 'client' && <ClientDashboard user={user} />}
    </div>
  );
}
