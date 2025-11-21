
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '../../data-provider';
import type { Task, TimerSession, User } from '@/lib/types';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Clock } from 'lucide-react';

const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};


export function TeamAnalytics({ dateRange }: { dateRange: number }) {
  const { teamMembers, tasks, timerSessions } = useData();

  const analyticsData = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRange);

    return teamMembers.map(member => {
        // Calculate completed tasks
        const completedTasks = (tasks || []).filter(task => {
            const remark = task.remarks.find(r => r.toStatus === 'Completed');
            if (task.assignedTo.id === member.id && remark) {
                return isAfter(parseISO(remark.timestamp), cutoffDate);
            }
            return false;
        }).length;
        
        // Calculate total tracked time
        const totalTime = (timerSessions || [])
            .filter(session => session.userId === member.id && isAfter(parseISO(session.date), cutoffDate))
            .reduce((acc, session) => acc + (session.endTime ? session.endTime - session.startTime : 0), 0);

        return {
            ...member,
            completedTasks,
            totalTime,
        }
    }).sort((a, b) => b.completedTasks - a.completedTasks || b.totalTime - a.totalTime); // Sort by tasks, then by time

  }, [teamMembers, tasks, dateRange, timerSessions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Performance metrics for each team member in the last {dateRange} days.</CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Rank</TableHead>
              <TableHead>Team Member</TableHead>
              <TableHead className="text-right">Tasks Completed</TableHead>
              <TableHead className="text-right">Time Tracked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyticsData.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="font-bold text-lg">
                    <div className='flex items-center gap-2'>
                        {index < 3 && <Award className={`h-6 w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'}`} />}
                        <span>#{index + 1}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                </TableCell>
                <TableCell className="text-right font-semibold text-lg">{member.completedTasks}</TableCell>
                <TableCell className="text-right font-mono">{formatTime(member.totalTime)}</TableCell>
              </TableRow>
            ))}
             {analyticsData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No data available for this period.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
