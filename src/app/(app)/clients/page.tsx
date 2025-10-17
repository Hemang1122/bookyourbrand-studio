import { clients } from '@/lib/data';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const user = await getUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <p className="text-muted-foreground">
          View and manage all client accounts in the system.
        </p>
      </div>
      <DataTable columns={columns} data={clients} />
    </div>
  );
}
