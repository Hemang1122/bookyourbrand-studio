'use client';

import { useState } from 'react';
import { projects as initialProjects } from '@/lib/data';
import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import type { Project } from '@/lib/types';


export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState(initialProjects);

  const handleProjectAdd = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
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
      <ProjectList projects={projects} />
    </div>
  );
}
