'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '../../data-provider';
import type { Task, TimerSession, User } from '@/lib/types';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import { Award, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours}`;
};


export function TeamAnalytics({ dateRange }: { dateRange: number }) {
  const { teamMembers, tasks, timerSessions } = useData();

  const analyticsData = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRange);
    const safeTasks = tasks || [];
    const safeTimerSessions = timerSessions || [];
    const safeTeamMembers = teamMembers || [];

    return safeTeamMembers.map(member => {
        const completedTasks = safeTasks.filter(task => {
            const remarks = task?.remarks || [];
            const remark = remarks.find(r => r.toStatus === 'Completed');
            if (task?.assignedTo?.id === member.id && remark) {
                return isAfter(parseISO(remark.timestamp), cutoffDate);
            }
            return false;
        }).length;
        
        const totalTime = safeTimerSessions
            .filter(session => session?.userId === member.id && session?.date && isAfter(parseISO(session.date), cutoffDate))
            .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);

        return {
            ...member,
            completedTasks,
            totalTime,
        }
    }).sort((a, b) => b.completedTasks - a.completedTasks || b.totalTime - a.totalTime);

  }, [teamMembers, tasks, dateRange, timerSessions]);

  const maxTasks = Math.max(...analyticsData.map(d => d.completedTasks), 0) || 1;

  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-xl font-bold text-white">Team Performance</h2>
                <p className="text-sm text-muted-foreground">Performance metrics for each team member in the last {dateRange} days.</p>
            </div>
        </div>

        {analyticsData.map((member, index) => (
            <div key={member.id}
                className={cn(
                "rounded-2xl p-4 flex items-center gap-4",
                "border transition-all duration-200",
                "hover:border-purple-500/30 hover:-translate-y-0.5",
                "hover:shadow-lg hover:shadow-purple-500/10",
                index === 0 
                    ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-400/10 to-slate-400/10 border-gray-400/20"
                    : index === 2
                    ? "bg-gradient-to-r from-orange-500/10 to-amber-600/10 border-orange-500/20"
                    : "bg-[#13131F] border-white/5"
                )}>
            
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "font-bold text-sm shrink-0",
                    index === 0 ? "bg-yellow-500/20 text-yellow-400"
                    : index === 1 ? "bg-gray-400/20 text-gray-300"
                    : index === 2 ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/5 text-muted-foreground"
                )}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200 font-bold">
                    {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                    <p className="text-lg font-bold text-white">{member.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                    <p className="text-lg font-bold text-white">{formatTime(member.totalTime)}</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                    </div>
                    
                    <div className="w-24 hidden lg:block">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                        </div>
                        <Progress value={(member.completedTasks / maxTasks) * 100} className="h-1.5" />
                    </div>
                </div>
            </div>
        ))}
         {analyticsData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                No team data available for this period.
            </div>
         )}
    </div>
  );
}
