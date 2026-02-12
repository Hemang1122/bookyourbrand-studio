
'use client';

import { useEffect, useState, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/task-list';
import { FileManager } from './components/file-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListTodo, Files, Info, Users, Edit, Trash2, MessageSquare } from 'lucide-react';
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
import { ProjectChat } from './components/project-chat';


const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
        case 'In Progress':
            return 'bg-green-600/90 hover:bg-green-600 text-white';
        case 'Completed':
            return '';
        case 'On Hold':
            return 'bg-amber-500/90 hover:bg-amber-500 text-white';
        case 'Rework':
            return 'bg-red-500/90 hover:bg-red-500 text-white';
        default:
            return '';
    }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { projects, isLoading, deleteProject, updateProject, users } = useData();
  const { toast } = useToast();

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

  const teamEditorMapping = useMemo(() => {
    if (!users) return new Map<string, string>();
    const mapping = new Map<string, string>();
    let editorCount = 1;
    users
      .filter(u => u.role === 'team')
      .forEach(u => {
        mapping.set(u.id, `Editor ${editorCount++}`);
      });
    return mapping;
  }, [users]);

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
                <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!project) {
    // This will be called if the project is not found after loading.
    return notFound();
  }
  
  const teamMembers = users.filter(u => project.team_ids && project.team_ids.includes(u.id));
  const getClientName = (client: Client) => {
    return client.name || client.email?.split('@')[0] || "Client";
  }

  let displayTeamMembers: Partial<User>[] = teamMembers;

  if (user?.role === 'client') {
    displayTeamMembers = (project.team_ids || [])
      .map(id => {
        const member = users.find(u => u.id === id);
        if (!member) return null;
        if (member.role === 'admin') return { id: member.id, name: member.name };
        return { id: member.id, name: teamEditorMapping.get(id) || 'Editor' };
      })
      .filter(Boolean) as Partial<User>[];
  }


  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-muted-foreground">For client: {getClientName(project.client)}</p>
        </div>
        <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <>
                <EditProjectDialog project={project} onProjectUpdate={updateProject}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </EditProjectDialog>
                <DeleteProjectDialog project={project} onProjectDelete={deleteProject}>
                   <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                  </Button>
                </DeleteProjectDialog>
              </>
            )}
             {user?.role === 'team' || user?.role === 'admin' ? (
              <Select onValueChange={(value: ProjectStatus) => handleStatusChange(value)} value={project.status}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Rework">Rework</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
               <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'} className={cn("text-base px-4 py-2", getStatusBadgeClass(project.status))}>
                  {project.status}
              </Badge>
            )}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {project.guidelines && (
          <Card className="md:col-span-2">
            <CardHeader className='pb-2'>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Project Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{project.guidelines}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Project Team
                </CardTitle>
                {user?.role === 'admin' && (
                    <ManageTeamDialog project={project}>
                        <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" /> Manage
                        </Button>
                    </ManageTeamDialog>
                )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {displayTeamMembers.map(member => {
                return (
                    <div key={member.id}>
                        <p className="font-semibold text-sm">{member.name}</p>
                        {user?.role !== 'client' && <p className="text-xs text-muted-foreground">{member.email}</p>}
                    </div>
                )
            })}
             {displayTeamMembers.length === 0 && <p className="text-sm text-muted-foreground">No team members assigned.</p>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks"><ListTodo className="mr-2 h-4 w-4" />Tasks</TabsTrigger>
          <TabsTrigger value="files"><Files className="mr-2 h-4 w-4" />Files</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage and track all tasks for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList projectId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files">
           <Card>
            <CardHeader>
              <CardTitle>File Management</CardTitle>
              <CardDescription>Upload and access all project-related files.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileManager projectId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chat">
           <Card className="h-[70vh]">
             <ProjectChat project={project} />
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
