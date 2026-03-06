'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock, FolderKanban, ArrowRight } from 'lucide-react';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useMemo } from 'react';
import { EditorResponsibilityPanel } from './editor-responsibility-panel';
import { ProjectCalendarCard } from './project-calendar-card';
import { DailyStandupCard } from './daily-standup-card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function TeamDashboard() {
  const { user } = useAuth();
  const { projects, tasks, timerSessions } = useData();
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  const myProjects = useMemo(() => {
    if (!user || !projects) return [];
    return projects.filter(p => p.team_ids && p.team_ids.includes(user.id));
  }, [projects, user]);

  const myTasks = useMemo(() => {
    if (!user || !tasks) return [];
    return tasks.filter(t => t.assignedTo?.id === user.id);
  }, [tasks, user]);

  // Calculate today's total tracked time from the new Time Tracker collection
  const todayTrackedMs = useMemo(() => {
    if (!timerSessions || !user) return 0;
    const todayEntries = timerSessions.filter(s => {
      // Handle both Date strings and Firestore Timestamps
      const createdDate = (s as any).createdAt instanceof Timestamp 
        ? (s as any).createdAt.toDate() 
        : new Date((s as any).createdAt);
      return isToday(createdDate) && s.userId === user.id;
    });
    // The new system uses 'duration' field in seconds
    return todayEntries.reduce((sum, s) => sum + ((s as any).duration || 0), 0) * 1000;
  }, [timerSessions, user]);
  
  if (!user) {
    return null;
  }
  
  const pendingTasks = myTasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress').length;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const requiredHoursMs = 8 * 3600 * 1000;
  const dailyProgress = Math.min((todayTrackedMs / requiredHoursMs) * 100, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-6">
            {/* New Time Tracker Summary Card */}
            <Card className="bg-gradient-to-br from-[#13131F] to-[#0F0F1A] border-white/10 overflow-hidden group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                        Productivity Tracking
                        <Clock className="h-4 w-4 text-primary" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Today</p>
                            <p className="text-4xl font-black text-white">{formatTime(todayTrackedMs)}</p>
                        </div>
                        <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                            <Link href="/time-tracker" className="flex items-center gap-2">
                                Open Tracker <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-gray-500">
                            <span>Daily Goal (8h)</span>
                            <span>{Math.round(dailyProgress)}%</span>
                        </div>
                        <Progress value={dailyProgress} className="h-1.5 bg-white/5" />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
                </div>
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

        <div className="sticky top-6 space-y-6">
          <EditorResponsibilityPanel elapsedTime={todayTrackedMs} />
          <DailyStandupCard />
        </div>
    </div>
  );
}

import { useState } from 'react';
