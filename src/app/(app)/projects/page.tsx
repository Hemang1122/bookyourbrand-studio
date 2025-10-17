import { projects } from '@/lib/data';
import { ProjectList } from './components/project-list';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function ProjectsPage() {
  const user = await getUser();
  // In a real app, you would fetch projects based on user role
  const allProjects = projects;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        {user?.role === 'admin' && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>
      <ProjectList projects={allProjects} />
    </div>
  );
}
