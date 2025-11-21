
'use client';
import { useState } from 'react';
import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { type ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const statusFilters: (ProjectStatus | 'All')[] = ['All', 'Active', 'In Progress', 'Rework', 'Completed', 'On Hold'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addProject } = useData();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {user?.role === 'admin' && (
            <AddProjectDialog onProjectAdd={addProject}>
                <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
                </Button>
            </AddProjectDialog>
            )}
        </div>
      </div>

       <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusFilters.map(status => (
          <Button
            key={status}
            variant={activeFilter === status ? 'default' : 'outline'}
            onClick={() => setActiveFilter(status)}
            className={cn("shrink-0", activeFilter === status && "bg-primary hover:bg-primary/90")}
          >
            {status}
          </Button>
        ))}
      </div>
      
      <ProjectList statusFilter={activeFilter} searchQuery={searchQuery} />
    </div>
  );
}
