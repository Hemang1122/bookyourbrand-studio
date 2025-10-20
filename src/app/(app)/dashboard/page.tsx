'use client';

import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { WelcomeHeader } from './components/welcome-header';
import { useAuth } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';


export default function DashboardPage() {
  const { user } = useAuth();
  
  // This state is important to prevent flashes of incorrect content
  // if the user object is not immediately available.
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <WelcomeHeader name={user.name || 'User'} />
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'team' && <TeamDashboard />}
      {user.role === 'client' && <ClientDashboard />}
    </div>
  );
}
