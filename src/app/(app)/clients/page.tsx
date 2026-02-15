
'use client';

import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useData } from '../data-provider';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';

export default function ClientsPage() {
  const { user } = useAuth();
  const { clients } = useData();

  if (user?.role !== 'admin') {
    // Non-admins should not see this page.
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">
            View and manage all client accounts in the system.
            </p>
        </div>
      </div>
      <DataTable columns={columns} data={clients} />
    </div>
  );
}
