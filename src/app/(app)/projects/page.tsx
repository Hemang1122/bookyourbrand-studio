'use client';

import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { useData } from '../data-provider';


export default function ProjectsPage() {
  const { user } = useAuth();
  const { addProject } = useData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
      </div>
      <ProjectList />
    </div>
  );
}
