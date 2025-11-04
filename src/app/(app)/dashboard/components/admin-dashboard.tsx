
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FolderKanban, CheckCircle2 } from 'lucide-react';
import { OverviewChart } from './overview-chart';
import { useData } from '../../data-provider';
import { DailyStandupCard } from './daily-standup-card';
import type { Client } from '@/lib/types';
import { useMemo } from 'react';
import { subDays, isAfter } from 'date-fns';


export function AdminDashboard() {
    const { projects, tasks, isLoading, clients, messages } = useData();
    
    const safeTasks = tasks || [];
    const safeProjects = projects || [];
    const safeClients = clients || [];
    const safeMessages = messages || [];

    const completedTasks = safeTasks.filter(t => t.status === 'Completed').length;
    const activeProjects = safeProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
    const totalProjects = safeProjects.length;
    const totalTasks = safeTasks.length;

    const recentActivityCount = useMemo(() => {
        const oneDayAgo = subDays(new Date(), 1);
        
        const recentTaskUpdates = safeTasks.reduce((count, task) => {
            const recentRemarks = (task.remarks || []).filter(remark => 
                isAfter(new Date(remark.timestamp), oneDayAgo)
            ).length;
            return count + recentRemarks;
        }, 0);

        const recentMessages = safeMessages.filter(message => 
            message.timestamp && isAfter(message.timestamp.toDate(), oneDayAgo)
        ).length;

        return recentTaskUpdates + recentMessages;
    }, [safeTasks, safeMessages]);

    const activityLevel = useMemo(() => {
        if (recentActivityCount > 10) return 'High';
        if (recentActivityCount > 0) return 'Medium';
        return 'Low';
    }, [recentActivityCount]);


  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-card-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : safeClients.length}</div>
            <p className="text-xs text-muted-foreground">+2 since last month</p>
          </CardContent>
        </Card>
        <Card className="animate-card-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : activeProjects}</div>
            <p className="text-xs text-muted-foreground">{totalProjects} total projects</p>
          </CardContent>
        </Card>
        <Card className="animate-card-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{isLoading ? '...' : completedTasks}</div>
            <p className="text-xs text-muted-foreground">{totalTasks} total tasks</p>
          </CardContent>
        </Card>
        <Card className="animate-card-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityLevel}</div>
            <p className="text-xs text-muted-foreground">{recentActivityCount} updates in last 24h</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
            <Card className="animate-card-in" style={{ animationDelay: '600ms' }}>
            <CardHeader>
                <CardTitle>Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <OverviewChart tasks={safeTasks} />
            </CardContent>
            </Card>
        </div>
        <div className="col-span-4 lg:col-span-3 space-y-4">
            <DailyStandupCard className="animate-card-in" style={{ animationDelay: '700ms' }} />
        </div>
      </div>
    </div>
  );
}
