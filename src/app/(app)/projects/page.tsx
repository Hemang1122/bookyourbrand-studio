'use client';
import { useState, useMemo } from 'react';
import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { type ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const statusFilters: (ProjectStatus | 'All')[] = ['All', 'Active', 'In Progress', 'Rework', 'Completed', 'Approved', 'On Hold'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addProject, projects } = useData();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const projectCounts = useMemo(() => {
    if (!projects) return { totalCount: 0, activeCount: 0, inProgressCount: 0, completedCount: 0, onHoldCount: 0, reworkCount: 0, approvedCount: 0 };
    return {
        totalCount: projects.length,
        activeCount: projects.filter(p => p.status === 'Active').length,
        inProgressCount: projects.filter(p => p.status === 'In Progress').length,
        completedCount: projects.filter(p => p.status === 'Completed').length,
        onHoldCount: projects.filter(p => p.status === 'On Hold').length,
        reworkCount: projects.filter(p => p.status === 'Rework').length,
        approvedCount: projects.filter(p => p.status === 'Approved').length,
    };
  }, [projects]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
                    <FolderKanban className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Projects</h1>
            </div>
            <p className="text-muted-foreground ml-14 text-sm">
                {projectCounts.totalCount} projects · {projectCounts.activeCount} active
            </p>
        </div>
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name..."
                    className="w-64 rounded-full bg-white/5 border border-white/10 focus-within:border-purple-500/50 pl-10 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {user?.role === 'admin' && (
            <AddProjectDialog onProjectAdd={addProject}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg hover:opacity-90 transition-opacity">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
                </Button>
            </AddProjectDialog>
            )}
        </div>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', count: projectCounts.totalCount, color: 'text-white' },
          { label: 'Active', count: projectCounts.activeCount, color: 'text-blue-400' },
          { label: 'In Progress', count: projectCounts.inProgressCount, color: 'text-purple-400' },
          { label: 'Rework', count: projectCounts.reworkCount, color: 'text-orange-400' },
          { label: 'Completed', count: projectCounts.completedCount + projectCounts.approvedCount, color: 'text-green-400' },
          { label: 'On Hold', count: projectCounts.onHoldCount, color: 'text-gray-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 text-center bg-[#13131F] border border-white/5">
            <p className={cn("text-xl font-bold", stat.color)}>
              {stat.count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

       <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusFilters.map(status => (
          <Button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={cn(
                "shrink-0 rounded-full h-8 px-4 text-sm transition-all",
                activeFilter === status 
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-md shadow-purple-500/25" 
                : "bg-transparent text-muted-foreground border border-white/10 hover:border-purple-500/30 hover:text-white"
            )}
          >
            {status}
          </Button>
        ))}
      </div>
      
      <ProjectList statusFilter={activeFilter} searchQuery={searchQuery} />
    </div>
  );
}
