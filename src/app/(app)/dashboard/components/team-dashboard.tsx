
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo, Clock, FolderKanban } from 'lucide-react';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo, useState } from 'react';
import { WorkTimer } from './work-timer';
import { EditorResponsibilityPanel } from './editor-responsibility-panel';
import { ProjectCalendarCard } from './project-calendar-card';
import { DailyStandupCard } from './daily-standup-card';


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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-6">
            {/* Top section with Work Timer */}
            <div className="w-full max-w-md mx-auto">
                <WorkTimer onTimeUpdate={setElapsedTime} />
            </div>

            {/* Main content grid */}
            <div className="space-y-6">
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
                
                <ProjectCalendarCard selectedDate={calendarDate} onDateChange={setCalendarDate} />
            </div>
        </div>

        {/* Right Column (Sticky) */}
        <div className="sticky top-6 space-y-6">
          <EditorResponsibilityPanel elapsedTime={elapsedTime} />
          <DailyStandupCard />
        </div>
    </div>
  );
}
