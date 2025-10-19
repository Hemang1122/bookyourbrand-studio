
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import type { User } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '../../data-provider';
import { DailyStandupCard } from './daily-standup-card';

type TeamDashboardProps = {
  user: User;
};

export function TeamDashboard({ user }: TeamDashboardProps) {
  const { projects, tasks } = useData();
  const myTasks = tasks.filter(t => t.assignedTo.id === user.id);
  const pendingTasks = myTasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="lg:col-span-1">
            <DailyStandupCard />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Active Tasks</CardTitle>
          <CardDescription>
            Here are the tasks currently assigned to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTasks.slice(0, 5).map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{projects.find(p => p.id === task.projectId)?.name}</TableCell>
                  <TableCell>
                    <Badge variant={task.status === 'Completed' ? 'secondary' : 'default'}
                      className={
                        task.status === 'In Progress' ? 'bg-blue-500 text-white' :
                        task.status === 'Pending' ? 'bg-yellow-500 text-white' : ''
                      }
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${task.projectId}`}>View Project</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
