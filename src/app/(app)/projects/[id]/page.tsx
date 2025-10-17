'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/task-list';
import { ChatRoom } from './components/chat-room';
import { FileManager } from './components/file-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListTodo, MessageSquare, Files, Info, Users, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../../data-provider';
import type { Project, User } from '@/lib/types';
import { useAuth } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ManageTeamDialog } from './components/manage-team-dialog';


export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { projects } = useData();

  const [project, setProject] = useState<Project | undefined | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We find the project from the context now.
    const foundProject = projects.find((p) => p.id === id);
    setProject(foundProject);
    setLoading(false);
  }, [id, projects]);


  if (loading) {
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

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-muted-foreground">For client: {project.client.name}</p>
        </div>
        <div>
            <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'} className="text-base px-4 py-2">
                {project.status}
            </Badge>
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
          <CardContent className="flex flex-wrap gap-4">
            {project.team.map(member => {
                const avatar = PlaceHolderImages.find(img => img.id === member.avatar);
                return (
                    <div key={member.id} className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={avatar?.imageUrl} alt={member.name} data-ai-hint={avatar?.imageHint} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                    </div>
                )
            })}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks"><ListTodo className="mr-2 h-4 w-4" />Tasks</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="files"><Files className="mr-2 h-4 w-4" />Files</TabsTrigger>
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
        <TabsContent value="chat">
           <Card>
            <CardHeader>
              <CardTitle>Chat Room</CardTitle>
              <CardDescription>Communicate with the client and team in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatRoom projectId={project.id} />
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
      </Tabs>
    </div>
  );
}
