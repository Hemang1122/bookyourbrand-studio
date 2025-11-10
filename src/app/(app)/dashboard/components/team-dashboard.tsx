'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2, FolderKanban, CalendarDays, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '../../data-provider';
import { DailyStandupCard } from './daily-standup-card';
import { useAuth } from '@/firebase/provider';
import { useMemo, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { WorkTimer } from './work-timer';

function GradientScribble() {
    const id = useMemo(() => `grad-${Math.random().toString(36).substr(2, 9)}`, []);
    return (
        <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.7 }} />
                    <stop offset="50%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.7 }} />
                </linearGradient>
            </defs>
            <path
                d="M 5,5 C 25,25 30,5 50,20 S 70,60 95,55 S 80,80 50,95 S 20,80 5,95"
                stroke={`url(#${id})`}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
            />
             <path
                d="M 95,5 C 75,25 70,5 50,20 S 30,60 5,55 S 20,80 50,95 S 80,80 95,95"
                stroke={`url(#${id})`}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-40"
            />
        </svg>
    );
}

export function TeamDashboard() {
  const { user } = useAuth();
  const { projects, tasks } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const myProjects = useMemo(() => {
    if (!user || !projects) return [];
    return projects.filter(p => p.team_ids && p.team_ids.includes(user.id));
  }, [projects, user]);

  const projectsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return myProjects.filter(p => isSameDay(parseISO(p.startDate), selectedDate));
  }, [myProjects, selectedDate]);


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
    <div className="space-y-6">
       
       <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div className="hidden md:block md:col-span-1 h-32">
                <GradientScribble />
            </div>
            <div className="md:col-span-3">
                <WorkTimer />
            </div>
            <div className="hidden md:block md:col-span-1 h-32 scale-x-[-1]">
                 <GradientScribble />
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
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Projects Starting on {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
                <CardDescription>
                    Here are the projects scheduled to start on the selected date.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {projectsForSelectedDate.length > 0 ? (
                        projectsForSelectedDate.map(project => (
                            <div key={project.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-semibold">{project.name}</h3>
                                    <p className="text-sm text-muted-foreground">Client: {project.client.name}</p>
                                     <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        <span>Deadline: {format(new Date(project.deadline), 'PP')}</span>
                                    </div>
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
                        <p className="text-muted-foreground">No projects starting on this day.</p>
                    </div>
                   )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Project Calendar</CardTitle>
                    <CardDescription className="text-sm">Select a date to see projects.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        disabled={(date) => {
                            // Disable dates that have no projects starting
                            return !myProjects.some(p => isSameDay(parseISO(p.startDate), date));
                        }}
                    />
                </CardContent>
            </Card>
            <DailyStandupCard />
        </div>
      </div>
    </div>
  );
}
