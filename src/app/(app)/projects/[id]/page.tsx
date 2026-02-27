'use client';

import { useEffect, useState, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/task-list';
import { FileManager } from './components/file-manager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, Info, Users, Settings, LayoutList, FolderOpen, MessageSquare, Plus, Calendar, Pencil, Trash2, FileIcon, Download, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../data-provider';
import type { Project, Client, User, ProjectStatus } from '@/lib/types';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { ManageTeamDialog } from './components/manage-team-dialog';
import { EditProjectDialog } from './components/edit-project-dialog';
import { DeleteProjectDialog } from './components/delete-project-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

const ProjectChatDynamic = dynamic(
  () => import('./components/project-chat').then(mod => ({ default: mod.ProjectChat })),
  { ssr: false }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { projects, isLoading, deleteProject, updateProject, users } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const project = useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [id, projects]);
  
  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (project) {
      updateProject(project.id, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Project status changed to ${newStatus}.`,
      });
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-48 mt-2" />
                </div>
                <div>
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <Card>
                <div className="p-6">
                    <Skeleton className="h-96 w-full" />
                </div>
            </Card>
        </div>
    )
  }

  if (!project) {
    return notFound();
  }
  
  const displayTeamMembers = users.filter(u => project.team_ids && project.team_ids.includes(u.id));
  const getClientName = (client: Client) => {
    return client.name || client.email?.split('@')[0] || "Client";
  }


  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-8 mb-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <span onClick={() => router.push('/projects')} className="hover:text-purple-400 cursor-pointer transition-colors">
              Projects
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{project.name}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
              <p className="text-muted-foreground">
                For client: <span className="text-purple-400 ml-1">{getClientName(project.client)}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
               {project.status === 'Approved' ? (
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                    Approved by Client
                 </div>
               ) : user?.role === 'team' || user?.role === 'admin' ? (
                <Select onValueChange={(value: ProjectStatus) => handleStatusChange(value)} value={project.status}>
                  <SelectTrigger className="rounded-xl px-4 py-2 text-sm font-medium border bg-white/5 text-white border-white/10 focus:border-purple-500/50 focus:outline-none w-[180px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Rework">Rework</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                 <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold")}>{project.status}</span>
              )}
              {user?.role === 'admin' && (
                <>
                  <EditProjectDialog project={project} onProjectUpdate={updateProject}>
                    <Button variant="outline" size="sm" className="border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-white">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </EditProjectDialog>
                  <DeleteProjectDialog project={project} onProjectDelete={deleteProject}>
                    <Button variant="outline" size="sm" className="border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeleteProjectDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
       {project.clientFeedback && (
        <div className="rounded-2xl p-5 mb-4 bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-orange-400" />
                <h3 className="font-semibold text-orange-400">Client Requested Changes</h3>
                {project.feedbackAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(project.feedbackAt), 'PPp')}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{project.clientFeedback}</p>
        </div>
       )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl p-5 bg-[#13131F] border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Info className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Project Guidelines</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{project.guidelines || 'No guidelines provided.'}</p>
        </div>

        <div className="rounded-2xl p-5 bg-[#13131F] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/10">
                <Users className="h-4 w-4 text-pink-400" />
              </div>
              <h3 className="font-semibold text-white">Project Team</h3>
            </div>
            {user?.role === 'admin' && (
              <ManageTeamDialog project={project}>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  <Settings className="h-3 w-3 mr-1" /> Manage
                </Button>
              </ManageTeamDialog>
            )}
          </div>
          <div className="space-y-3">
            {displayTeamMembers.length > 0 ? displayTeamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role !== 'client' && member.email}</p>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No team members assigned.</p>}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="flex gap-1 p-1 rounded-xl mb-6 bg-white/5 border border-white/5 w-fit">
          <TabsTrigger value="tasks" className="px-6 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/25 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5">
              <LayoutList className="h-4 w-4 mr-2" />Tasks
          </TabsTrigger>
          <TabsTrigger value="files" className="px-6 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/25 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5">
              <FolderOpen className="h-4 w-4 mr-2" />Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <TaskList projectId={project.id} />
        </TabsContent>
        <TabsContent value="files">
           <FileManager projectId={project.id} />
        </TabsContent>
      </Tabs>

      {project && (
        <ProjectChatDynamic
          projectId={project.id}
          projectName={project.name}
          teamMembers={displayTeamMembers}
          client={project.client}
        />
      )}
    </div>
  );
}
