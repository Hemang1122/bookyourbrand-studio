'use client';

import { useState, useEffect } from 'react';
import { projects as initialProjects, tasks as initialTasks, chatMessages, projectFiles } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './components/task-list';
import { ChatRoom } from './components/chat-room';
import { FileManager } from './components/file-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListTodo, MessageSquare, Files } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState(() => initialProjects.find((p) => p.id === id));
  const [tasks, setTasks] = useState(() => initialTasks.filter((t) => t.projectId === id));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch project data here.
    // We are simulating a fetch with the static data.
    const foundProject = initialProjects.find((p) => p.id === id);
    if (foundProject) {
        setProject(foundProject);
        setTasks(initialTasks.filter((t) => t.projectId === id))
    }
    setLoading(false);
  }, [id]);

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
    return notFound();
  }

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
              <TaskList initialTasks={tasks} projectId={project.id} />
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
