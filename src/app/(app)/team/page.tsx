import { users } from '@/lib/data';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
  const user = await getUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  const data = users.filter(u => u.role === 'admin' || u.role === 'team');

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
        <p className="text-muted-foreground">
          View and manage all team members in the system.
        </p>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
