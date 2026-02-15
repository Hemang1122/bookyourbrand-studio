'use client';

import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/firebase/provider';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useData } from '../data-provider';
import { AddUserDialog } from './components/add-user-dialog';

export default function TeamPage() {
  const { user } = useAuth();
  const { teamMembers, createUser } = useData();

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
                <h2 className="text-3xl font-bold tracking-tight">Team & User Management</h2>
                <p className="text-muted-foreground">
                Add, view, and manage all user accounts in the system.
                </p>
            </div>
            {user?.role === 'admin' && (
              <AddUserDialog>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </AddUserDialog>
            )}
        </div>
      <DataTable columns={columns} data={teamMembers} />
    </div>
  );
}
