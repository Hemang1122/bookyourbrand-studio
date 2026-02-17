
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, Plus, Film } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AddProjectDialog } from '../../projects/components/add-project-dialog';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { UpgradeDialog } from '../../settings/billing/components/upgrade-dialog';

export function ClientDashboard() {
  const { user } = useAuth();
  const { projects, tasks, addProject, isLoading, clients } = useData();

  const myClientRecord = useMemo(() => {
    if (!user || !clients) return null;
    return clients.find(c => c.id === user.id);
  }, [user, clients]);


  if (isLoading || !myClientRecord) {
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

  const myProjects = projects ? projects.filter(p => p.client.id === myClientRecord?.id) : [];
  const activeProjects = myProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const completedProjects = myProjects.filter(p => p.status === 'Completed').length;
  const safeTasks = tasks || [];
  
  const activeProjectCount = (projects || []).filter(p => p.client.id === myClientRecord.id && p.status !== 'Completed' && p.status !== 'Approved').length;
  const reelsLimit = myClientRecord.reelsLimit || 0;
  const canAddProject = activeProjectCount < reelsLimit;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Client Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your personal dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
            {canAddProject ? (
              <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
              </AddProjectDialog>
            ) : (
              <UpgradeDialog client={myClientRecord}>
                 <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Upgrade Plan
                </Button>
              </UpgradeDialog>
            )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{myClientRecord.packageName || 'N/A'} Plan</div>
            <div className="rounded-xl p-4 bg-white/[0.03] border border-white/5">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="text-sm font-bold text-white">
                        {activeProjectCount} / {reelsLimit === 9999 ? 'Unlimited' : reelsLimit}
                    </span>
                </div>
                <Progress value={reelsLimit === 9999 ? 5 : Math.min(100, (activeProjectCount / reelsLimit) * 100)} className="h-1.5"/>
                <p className="text-xs text-muted-foreground mt-2">
                    {reelsLimit === 9999 ? 'Unlimited projects on Enterprise plan'
                    : `${reelsLimit - activeProjectCount} projects remaining`}
                </p>
            </div>
          </CardContent>
        </Card>
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
        <CardContent>
          {myProjects.length > 0 ? (
            <div className="space-y-6">
              {myProjects.map(project => {
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
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You have no projects yet.</p>
              {canAddProject ? (
                  <AddProjectDialog onProjectAdd={addProject} client={myClientRecord}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Project
                    </Button>
                  </AddProjectDialog>
              ) : (
                  <UpgradeDialog client={myClientRecord}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Upgrade to Add Project
                    </Button>
                  </UpgradeDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
