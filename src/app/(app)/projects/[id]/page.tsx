'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/task-list';
import { ChatRoom } from './components/chat-room';
import { FileManager } from './components/file-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListTodo, MessageSquare, Files, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { chatMessages, projectFiles } from '@/lib/data';
import { useData } from '../../data-provider';
import type { Project } from '@/lib/types';


export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
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

  // Mock data for chat and files still used for simplicity
  const messages = chatMessages[project.id] || [];
  const files = projectFiles[project.id] || [];

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
      
      {project.guidelines && (
        <Card>
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
              <ChatRoom initialMessages={messages} />
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
              <FileManager initialFiles={files} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
