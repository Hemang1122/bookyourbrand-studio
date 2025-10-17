import { projects } from '@/lib/data';
import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getUser } from '@/lib/auth';

export default async function ProjectsPage() {
  const user = await getUser();
  // In a real app, you would fetch projects based on user role
  const allProjects = projects;

  const handleProjectAdd = async (project: any) => {
    'use server';
    // This is a mock implementation. In a real app, you'd save this to a database.
    console.log('New project added:', project);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        {user?.role === 'admin' && (
           <AddProjectDialog onProjectAdd={handleProjectAdd}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </AddProjectDialog>
        )}
      </div>
      <ProjectList projects={allProjects} />
    </div>
  );
}
