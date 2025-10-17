
'use client';

import { users as initialUsers } from '@/lib/data';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TeamPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>(initialUsers.filter(u => u.role === 'admin' || u.role === 'team'));

  if (user?.role !== 'admin') {
    // Non-admins should not see this page.
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }

  const handleAddTeamMember = () => {
    const newId = `user-${initialUsers.length + teamMembers.length + 1}`;
    const newMember: User = {
      id: newId,
      name: `New Member ${teamMembers.length - 1}`,
      email: `new-member-${teamMembers.length -1}@example.com`,
      avatar: `avatar-${(teamMembers.length % 3) + 1}`,
      role: 'team',
    };
    // In a real app, this would be an API call. Here, we update local state.
    setTeamMembers(prev => [...prev, newMember]);
    console.log("New team member created (add to data.ts for persistence):", newMember);
  };


  return (
    <div className="container mx-auto py-10">
       <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
                <p className="text-muted-foreground">
                View and manage all team members in the system.
                </p>
            </div>
            {user?.role === 'admin' && (
                <Button onClick={handleAddTeamMember}>
                    <Plus className="mr-2 h-4 w-4" /> Add Team Member
                </Button>
            )}
        </div>
      <DataTable columns={columns} data={teamMembers} />
    </div>
  );
}
