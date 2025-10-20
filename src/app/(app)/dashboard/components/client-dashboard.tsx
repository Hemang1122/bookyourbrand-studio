
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AddProjectDialog } from '../../projects/components/add-project-dialog';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import type { Client } from '@/lib/types';

export function ClientDashboard() {
  const { user } = useAuth();
  const { projects, tasks, addProject, isLoading } = useData();

  // The user object for a client *is* their client record for dashboard purposes.
  // We can treat the User as a Client here if the roles match.
  const myClientRecord = user as unknown as Client;

  if (!user || isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Client Dashboard</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>My Projects Overview</CardTitle>
                    <CardDescription>Track the progress of your ongoing projects.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                     <p className="text-muted-foreground mb-4">Loading client data...</p>
                </CardContent>
            </Card>
        </div>
      )
  }

  // Find projects where the client ID matches the logged-in user's ID
  const myProjects = projects ? projects.filter(p => p.client.id === myClientRecord?.id) : [];
  const activeProjects = myProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const completedProjects = myProjects.filter(p => p.status === 'Completed').length;
  const safeTasks = tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Client Dashboard</h2>
        <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
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
              <CardDescription>Track the progress of your ongoing projects.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {myProjects.length > 0 ? (
            myProjects.map(project => {
              const projectTasks = safeTasks.filter(t => t.projectId === project.id);
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
                    <div>Status: <Badge variant="outline">{project.status}</Badge></div>
                    <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You have no projects yet.</p>
              <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Project
                </Button>
              </AddProjectDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
