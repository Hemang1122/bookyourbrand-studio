'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, Plus } from 'lucide-react';
import type { Project, Task, User } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AddProjectDialog } from '../../projects/components/add-project-dialog';

type ClientDashboardProps = {
  user: User;
  projects: Project[];
  tasks: Task[];
};

export function ClientDashboard({ user, projects: initialProjects, tasks: initialTasks }: ClientDashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const myClientRecord = projects[0].client; // Mock: assume user is linked to a client record
  const myProjects = projects.filter(p => p.client.id === myClientRecord.id);
  const activeProjects = myProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const completedProjects = myProjects.filter(p => p.status === 'Completed').length;
  const [tasks, setTasks] = useState(initialTasks);

  const handleProjectAdd = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
         <AddProjectDialog onProjectAdd={handleProjectAdd} client={myClientRecord}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </AddProjectDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">{myProjects.length} total projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects on Hold</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myProjects.filter(p => p.status === 'On Hold').length}</div>
             <p className="text-xs text-muted-foreground">Waiting for feedback or assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>My Projects Overview</CardTitle>
                <CardDescription>
                    Track the progress of your ongoing projects.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {myProjects.map(project => {
             const projectTasks = tasks.filter(t => t.projectId === project.id);
             const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
             const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
            return (
                <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{project.name}</h3>
                         <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>View Details</Link>
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Progress value={progress} className="w-full" />
                        <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Status: <Badge variant="outline">{project.status}</Badge></span>
                         <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  );
}
