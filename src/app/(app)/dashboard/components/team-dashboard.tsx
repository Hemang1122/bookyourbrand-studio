'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo, Clock, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo, useState } from 'react';
import { WorkTimer } from './work-timer';
import { EditorResponsibilityPanel } from './editor-responsibility-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectCalendarCard } from './project-calendar-card';


export function TeamDashboard() {
  const { user } = useAuth();
  const { projects, tasks } = useData();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

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

  return (
    <div className="space-y-6">
      {/* Top section with Work Timer */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <WorkTimer onTimeUpdate={setElapsedTime} />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left and Center Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          </div>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myProjects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressTasks}</div>
              </CardContent>
            </Card>
          </div>
          
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             <Card className="xl:col-span-2">
                <CardHeader>
                <CardTitle>My Assigned Projects &amp; Schedule</CardTitle>
                <CardDescription>
                    Here are your projects and a calendar for start dates.
                </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScrollArea className="h-[400px] md:h-auto">
                    <div className="space-y-4 pr-4">
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
                        <p className="text-muted-foreground">
                            You have not been assigned to any projects yet.
                        </p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
                <ProjectCalendarCard selectedDate={calendarDate} onDateChange={setCalendarDate} />
                </CardContent>
            </Card>
           </div>
        </div>

        {/* Right Column (Sticky) */}
        <div className="lg:col-span-1">
          <EditorResponsibilityPanel elapsedTime={elapsedTime} />
        </div>
      </div>
    </div>
  );
}
