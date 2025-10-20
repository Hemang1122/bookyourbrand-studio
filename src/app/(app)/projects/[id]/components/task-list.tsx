
'use client';

import { useState } from 'react';
import type { Task, TaskStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, CheckCircle, Play, History, MoreHorizontal } from 'lucide-react';
import { useData } from '../../../data-provider';
import { useAuth } from '@/firebase/provider';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { AddManualTaskDialog } from './add-manual-task-dialog';

type TaskCardProps = {
  task: Task;
  onStatusUpdate: (task: Task) => void;
};

const TaskCard = ({ task, onStatusUpdate }: TaskCardProps) => {
  const { user } = useAuth();

  const canUpdateStatus = (user?.role === 'admin' || (user?.role === 'team' && user.id === task.assignedTo.id));

  const nextStatus: TaskStatus | null = task.status === 'Pending' ? 'In Progress' : task.status === 'In Progress' ? 'Completed' : null;
  const nextActionText = task.status === 'Pending' ? 'Start Progress' : 'Mark as Complete';
  const nextActionIcon = task.status === 'Pending' ? <Play className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />;
  
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => onStatusUpdate(task)}
                      className="cursor-pointer"
                    >
                      {nextActionIcon}
                      <span>{nextActionText}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between p-4 pt-0">
          <Badge variant="outline">Due: {new Date(task.dueDate).toLocaleDateString()}</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-xs text-muted-foreground">{task.assignedTo.name}</span>
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


type TaskListProps = {
  projectId: string;
};

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, addTask } = useData();
  const { user } = useAuth();
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isManualTaskOpen, setIsManualTaskOpen] = useState(false);
  const [isAiTaskOpen, setIsAiTaskOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const projectTasks = (tasks || []).filter((t) => t.projectId === projectId);

  const columns = {
    Pending: projectTasks.filter((t) => t.status === 'Pending'),
    'In Progress': projectTasks.filter((t) => t.status === 'In Progress'),
    Completed: projectTasks.filter((t) => t.status === 'Completed'),
  };

  const handleStatusUpdateClick = (task: Task) => {
    setCurrentTask(task);
    setIsStatusUpdateOpen(true);
  };
  
  const nextStatus = currentTask?.status === 'Pending' ? 'In Progress' : currentTask?.status === 'In Progress' ? 'Completed' : null;

  return (
    <>
      <div className="space-y-4">
        {(user?.role === 'admin' || user?.role === 'client') && (
          <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsManualTaskOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
              <Button onClick={() => setIsAiTaskOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => (
            <div key={status} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold tracking-tight">
                {status} <span className="text-sm text-muted-foreground">({columns[status].length})</span>
              </h3>
              <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
                {columns[status].map((task) => <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdateClick} />)}
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
       {currentTask && nextStatus && (
        <UpdateTaskStatusDialog 
          task={currentTask} 
          newStatus={nextStatus}
          open={isStatusUpdateOpen}
          onOpenChange={setIsStatusUpdateOpen}
        />
      )}
      <AddManualTaskDialog 
        projectId={projectId} 
        onTaskAdd={addTask} 
        open={isManualTaskOpen}
        onOpenChange={setIsManualTaskOpen}
      />
      <AddTaskDialog 
        projectId={projectId} 
        onTaskAdd={addTask} 
        open={isAiTaskOpen}
        onOpenChange={setIsAiTaskOpen}
      />
    </>
  );
}
