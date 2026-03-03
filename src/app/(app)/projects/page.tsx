
'use client';
import { useState, useMemo } from 'react';
import { ProjectList } from './components/project-list';
import { AddProjectDialog } from './components/add-project-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, FolderKanban, X, ArrowUpDown, ArrowUp, ArrowDown, Calendar, SortAsc, Filter, User } from 'lucide-react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { type ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

const statusFilters: (ProjectStatus | 'All')[] = ['All', 'Active', 'In Progress', 'Rework', 'Completed', 'Approved', 'On Hold'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addProject, projects: allProjects, isLoading } = useData();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedProjects = useMemo(() => {
    if (!allProjects) return [];

    let filtered = allProjects;

    // Filter by status
    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => p.status === activeFilter);
    }

    // Search by name or client
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          const dateA = (a as any).createdAt?.toDate?.() || new Date((a as any).createdAt || 0);
          const dateB = (b as any).createdAt?.toDate?.() || new Date((b as any).createdAt || 0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'status':
          const statusOrder = ['Active', 'In Progress', 'Rework', 'Completed', 'Approved', 'On Hold'];
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
        case 'client':
          comparison = (a.client?.name || '').localeCompare(b.client?.name || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [allProjects, activeFilter, searchQuery, sortBy, sortOrder]);

  const projectCounts = useMemo(() => {
    if (!allProjects) return { totalCount: 0, activeCount: 0, inProgressCount: 0, completedCount: 0, onHoldCount: 0, reworkCount: 0, approvedCount: 0 };
    return {
        totalCount: allProjects.length,
        activeCount: allProjects.filter(p => p.status === 'Active').length,
        inProgressCount: allProjects.filter(p => p.status === 'In Progress').length,
        completedCount: allProjects.filter(p => p.status === 'Completed').length,
        onHoldCount: allProjects.filter(p => p.status === 'On Hold').length,
        reworkCount: allProjects.filter(p => p.status === 'Rework').length,
        approvedCount: allProjects.filter(p => p.status === 'Approved').length,
    };
  }, [allProjects]);

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
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/20 border-primary/20 focus:border-primary/50 rounded-full"
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px] bg-black/20 border-primary/20 rounded-full">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sort by Date
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Sort by Name
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Sort by Status
                  </div>
                </SelectItem>
                <SelectItem value="client">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sort by Client
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border border-primary/20 hover:bg-primary/10 rounded-full shrink-0 h-10 w-10"
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>

            {user?.role === 'admin' && (
            <AddProjectDialog onProjectAdd={addProject}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg hover:opacity-90 transition-opacity rounded-full shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
                </Button>
            </AddProjectDialog>
            )}
        </div>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', count: projectCounts.totalCount, color: 'text-white', value: 'All' as const },
          { label: 'Active', count: projectCounts.activeCount, color: 'text-blue-400', value: 'Active' as const },
          { label: 'In Progress', count: projectCounts.inProgressCount, color: 'text-purple-400', value: 'In Progress' as const },
          { label: 'Rework', count: projectCounts.reworkCount, color: 'text-orange-400', value: 'Rework' as const },
          { label: 'Completed', count: projectCounts.completedCount + projectCounts.approvedCount, color: 'text-green-400', value: 'Completed' as const },
          { label: 'On Hold', count: projectCounts.onHoldCount, color: 'text-gray-400', value: 'On Hold' as const },
        ].map(stat => (
          <Card 
            key={stat.label} 
            className={cn(
              "p-3 text-center bg-[#13131F] border transition-all cursor-pointer hover:border-purple-500/30 hover:scale-[1.02]",
              activeFilter === stat.value ? "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10" : "border-white/5"
            )}
            onClick={() => setActiveFilter(stat.value)}
          >
            <p className={cn("text-2xl font-bold", stat.color)}>
              {stat.count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

       <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

      <div className="flex items-center justify-between px-2 text-sm text-gray-400">
        <p>
          Showing {filteredAndSortedProjects.length} of {allProjects?.length || 0} projects
        </p>
        {searchQuery && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="text-primary h-auto p-0"
          >
            Clear search
          </Button>
        )}
      </div>
      
      <ProjectList projects={filteredAndSortedProjects} isLoading={isLoading} />
    </div>
  );
}
