
'use client';

import { clients as initialClients, users as initialUsers } from '@/lib/data';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Client, User } from '@/lib/types';

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>(initialClients);

  if (user?.role !== 'admin') {
    // Non-admins should not see this page.
    // Using redirect in a client component is not ideal,
    // but for this mock app it's a simple solution.
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }

  const handleAddClient = () => {
    const newId = `client-${clients.length + 1}`;
    const newUser: User = {
      id: `user-${initialUsers.length + clients.length + 1}`,
      name: `New Client ${clients.length + 1}`,
      email: `new-client-${clients.length + 1}@example.com`,
      avatar: `avatar-${(clients.length % 6) + 1}`,
      role: 'client',
    };

    const newClient: Client = {
      id: newId,
      name: newUser.name,
      email: `contact@new-client-${clients.length + 1}.com`,
      company: 'New Company Inc.',
      avatar: newUser.avatar,
    };

    // In a real app, you would call an API to add the user and client.
    // Here we just update the local state for demonstration.
    setClients(prev => [...prev, newClient]);
    // Also log the new user to simulate adding them to the user list
    console.log("New client user created (add to data.ts for persistence):", newUser);
  };

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
            <Button onClick={handleAddClient}>
                <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
        )}
      </div>
      <DataTable columns={columns} data={clients} />
    </div>
  );
}
