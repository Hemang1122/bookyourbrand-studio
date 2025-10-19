'use client';

import type { Task, TaskStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, CheckCircle, Play, History } from 'lucide-react';
import { useData } from '../../../data-provider';
import { useAuth } from '@/lib/auth-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UpdateTaskStatusDialog } from './update-task-status-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

type TaskListProps = {
  projectId: string;
};

const TaskCard = ({ task }: { task: Task }) => {
  const { user } = useAuth();
  const userAvatar = PlaceHolderImages.find(img => img.id === task.assignedTo.avatar);

  const canUpdateStatus = (user?.role === 'admin' || (user?.role === 'team' && user.id === task.assignedTo.id));

  const nextStatus: TaskStatus | null = task.status === 'Pending' ? 'In Progress' : task.status === 'In Progress' ? 'Completed' : null;
  const nextActionText = task.status === 'Pending' ? 'Start Progress' : 'Mark as Complete';
  const nextActionIcon = task.status === 'Pending' ? <Play className="h-5 w-5 text-muted-foreground group-hover:text-blue-500" /> : <CheckCircle className="h-5 w-5 text-muted-foreground group-hover:text-green-500" />;

  return (
    <Card className="bg-background">
      <CardHeader className="p-4 flex flex-row items-start justify-between">
        <CardTitle className="text-base">{task.title}</CardTitle>
        <div className="flex items-center gap-1">
          {task.remarks && task.remarks.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <History className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Task History</h4>
                    <p className="text-sm text-muted-foreground">
                      Recent status changes for this task.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {task.remarks.slice().reverse().map((remark, index) => (
                      <div key={index} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0">
                         <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                         <div className="grid gap-1">
                            <p className="text-sm font-medium">{remark.userName} <span className="font-normal text-muted-foreground">moved to {remark.toStatus}</span></p>
                            <p className="text-sm text-muted-foreground">"{remark.remark}"</p>
                             <p className="text-xs text-muted-foreground">{format(new Date(remark.timestamp), "PPp")}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {canUpdateStatus && nextStatus && (
             <UpdateTaskStatusDialog task={task} newStatus={nextStatus}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 group">
                                {nextActionIcon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{nextActionText}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </UpdateTaskStatusDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between p-4 pt-0">
        <Badge variant="outline">Due: {task.dueDate}</Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar?.imageUrl} alt={task.assignedTo.name} data-ai-hint={userAvatar?.imageHint} />
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
};

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, addTask } = useData();
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
        {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => (
          <div key={status} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold tracking-tight">
              {status} <span className="text-sm text-muted-foreground">({columns[status].length})</span>
            </h3>
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
              {columns[status].map((task) => <TaskCard key={task.id} task={task} />)}
              {columns[status].length === 0 && (
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
