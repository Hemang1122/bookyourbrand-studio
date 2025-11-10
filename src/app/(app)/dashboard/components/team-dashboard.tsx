'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '../../data-provider';
import { DailyStandupCard } from './daily-standup-card';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { History } from 'lucide-react';
import { WorkTimer } from './work-timer';
import { ProjectCalendarCard } from './project-calendar-card';

export function TeamDashboard() {
  const { user } = useAuth();
  const { projects, tasks } = useData();

  const myProjects = useMemo(() => {
    if (!user || !projects) return [];
    return projects.filter(p => p.team_ids && p.team_ids.includes(user.id));
  }, [projects, user]);

  const myTasks = useMemo(() => {
    if (!user || !tasks) return [];
    return tasks.filter(t => t.assignedTo?.id === user.id);
  }, [tasks, user]);
  
  if (!user) {
    return null;
  }
  
  const pendingTasks = myTasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <WorkTimer />
        </div>
      </div>

       <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
         <Button variant="outline" asChild>
            <Link href="/work-timer">
                <History className="mr-2 h-4 w-4"/>
                View Session History
            </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projects you are a member of.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Waiting to be started.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Currently working on.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Finished this month.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
            <Card>
                <CardHeader>
                <CardTitle>My Assigned Projects</CardTitle>
                <CardDescription>
                    Here are the projects you are currently a member of.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {myProjects.length > 0 ? (
                        myProjects.map(project => (
                            <div key={project.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-semibold">{project.name}</h3>
                                    <p className="text-sm text-muted-foreground">Client: {project.client.name}</p>
                                </div>
                                 <div className='flex items-center gap-4'>
                                    <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'}>{project.status}</Badge>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/projects/${project.id}`}>View Project</Link>
                                    </Button>
                                 </div>
                            </div>
                        ))
                   ) : (
                     <div className="text-center py-8">
                        <p className="text-muted-foreground">You have not been assigned to any projects yet.</p>
                    </div>
                   )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <DailyStandupCard />
            <ProjectCalendarCard />
        </div>
      </div>
    </div>
  );
}
