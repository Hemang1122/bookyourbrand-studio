
'use client';

import { useAuth } from '@/lib/auth-client';
import { AdminDashboard } from './components/admin-dashboard';
import { TeamDashboard } from './components/team-dashboard';
import { ClientDashboard } from './components/client-dashboard';
import { useData } from '../data-provider';
import { WelcomeHeader } from './components/welcome-header';
import { Loader2 } from 'lucide-react';


export default function DashboardPage() {
  // useAuth now gets the fully-formed User object from the AppLayout context
  const { user, isLoading: isAuthLoading } = useAuth();
  const { clients, isLoading: isDataLoading } = useData();

  // isLoading now represents the DataProvider's loading state.
  const isLoading = isDataLoading;

  // The main layout already shows a loader, but we can have a fallback here too.
  if (isLoading || !user) return (
     <div className="flex-1 space-y-4 p-8 pt-6 flex items-center justify-center">
        <div className="flex items-center text-lg text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading Dashboard...</span>
        </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-4">
       <WelcomeHeader name={user.name} />
      {user.role === 'admin' && <AdminDashboard clients={clients} />}
      {user.role === 'team' && <TeamDashboard user={user} />}
      {user.role === 'client' && <ClientDashboard />}
    </div>
  );
}

    
