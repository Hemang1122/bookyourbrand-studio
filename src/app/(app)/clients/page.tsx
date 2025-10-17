
'use client';

import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddClientDialog } from './components/add-client-dialog';
import { useData } from '../data-provider';

export default function ClientsPage() {
  const { user } = useAuth();
  const { clients, addClient } = useData();

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
        {user?.role === 'admin' && (
            <AddClientDialog onClientAdd={addClient}>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </AddClientDialog>
        )}
      </div>
      <DataTable columns={columns} data={clients} />
    </div>
  );
}
