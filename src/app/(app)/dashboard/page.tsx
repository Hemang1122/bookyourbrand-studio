'use client';

import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { WelcomeHeader } from './components/welcome-header';
import { useAuth } from '@/firebase/provider';


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 space-y-4">
      <WelcomeHeader name={user?.name || ''} />
      {user?.role === 'admin' && <AdminDashboard />}
      {user?.role === 'team' && <TeamDashboard />}
      {user?.role === 'client' && <ClientDashboard />}
    </div>
  );
}
