'use client';

import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, CheckCircle } from 'lucide-react';
import { useData } from '../../../data-provider';
import { useAuth } from '@/lib/auth-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TaskListProps = {
  projectId: string;
};

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, addTask, updateTaskStatus } = useData();
  const { user } = useAuth();
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const columns = {
    Pending: projectTasks.filter((t) => t.status === 'Pending'),
    'In Progress': projectTasks.filter((t) => t.status === 'In Progress'),
    Completed: projectTasks.filter((t) => t.status === 'Completed'),
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            {user?.role === 'admin' && (
              <AddTaskDialog projectId={projectId} onTaskAdd={addTask}>
                <Button>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Tasks with AI
                </Button>
              </AddTaskDialog>
            )}
        </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Object.entries(columns).map(([status, tasksInColumn]) => (
          <div key={status} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold tracking-tight">
              {status} <span className="text-sm text-muted-foreground">({tasksInColumn.length})</span>
            </h3>
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
              {tasksInColumn.map((task) => {
                const userAvatar = PlaceHolderImages.find(img => img.id === task.assignedTo.avatar);
                const canComplete = user?.role === 'admin' || (user?.role === 'team' && user.id === task.assignedTo.id);

                return (
                    <Card key={task.id} className="bg-background">
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            {status !== 'Completed' && canComplete && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTaskStatus(task.id, 'Completed')}>
                                                <CheckCircle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Mark as Complete</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </CardHeader>
                        <CardContent className="flex items-center justify-between p-4 pt-0">
                            <Badge variant="outline">Due: {task.dueDate}</Badge>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={userAvatar?.imageUrl} alt={task.assignedTo.name} data-ai-hint={userAvatar?.imageHint}/>
                                            <AvatarFallback>{task.assignedTo.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Assigned to {task.assignedTo.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardContent>
                    </Card>
                );
              })}
              {tasksInColumn.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                    No tasks in this stage.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
