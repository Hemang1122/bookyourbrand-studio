'use client';

import { useState } from 'react';
import type { Task, TaskStatus, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, CheckCircle, Play, History, MoreHorizontal, AlertCircle, Calendar } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type TaskCardProps = {
  task: Task;
  onStatusUpdate: (task: Task, newStatus: TaskStatus) => void;
};

const TaskCard = ({ task, onStatusUpdate }: TaskCardProps) => {
  const { user } = useAuth();
  const canUpdateStatus = (user?.role === 'admin' || (user?.role === 'team' && user.id === task.assignedTo?.id));
  const assigneeName = task.assignedTo?.name || 'Unassigned';

  const statusColors = {
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Rework': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
      <div className="rounded-xl p-4 mb-3 bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                    {task.title}
                </p>
                <Badge variant="outline" className={cn("mt-1 text-[10px] h-5 py-0 px-2 font-semibold", statusColors[task.status])}>
                    {task.status}
                </Badge>
            </div>
            <div className="flex items-center gap-1">
            {task.remarks && task.remarks.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                    <History className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Task History</h4>
                      <p className="text-sm text-muted-foreground">Recent status changes for this task.</p>
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
            {canUpdateStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {task.status === 'Pending' && (
                        <DropdownMenuItem onSelect={() => onStatusUpdate(task, 'In Progress')} className="cursor-pointer">
                            <Play className="mr-2 h-4 w-4" /> <span>Start Progress</span>
                        </DropdownMenuItem>
                    )}
                    {task.status === 'In Progress' && (
                        <DropdownMenuItem onSelect={() => onStatusUpdate(task, 'Completed')} className="cursor-pointer">
                            <CheckCircle className="mr-2 h-4 w-4" /> <span>Mark as Complete</span>
                        </DropdownMenuItem>
                    )}
                    {(task.status === 'Completed' || task.status === 'Rework') && (
                        <DropdownMenuItem onSelect={() => onStatusUpdate(task, 'In Progress')} className="cursor-pointer">
                            <Play className="mr-2 h-4 w-4" /> <span>Re-Open Task</span>
                        </DropdownMenuItem>
                    )}
                     {task.status === 'Completed' && (
                        <DropdownMenuItem onSelect={() => onStatusUpdate(task, 'Rework')} className="cursor-pointer text-amber-600 focus:text-amber-700">
                           <AlertCircle className="mr-2 h-4 w-4" /> <span>Request Rework</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {task.dueDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">{assigneeName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">{assigneeName}</span>
            </div>
        </div>
      </div>
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
  const [nextStatus, setNextStatus] = useState<TaskStatus | null>(null);


  const projectTasks = (tasks || []).filter((t) => t.projectId === projectId).sort((a, b) => (a as any).order - (b as any).order);
  
  const statusConfig: { [key in TaskStatus]: { color: string, textColor: string } } = {
    Pending: { color: 'bg-yellow-400', textColor: 'text-yellow-400' },
    'In Progress': { color: 'bg-blue-400', textColor: 'text-blue-400' },
    'Rework': { color: 'bg-orange-400', textColor: 'text-orange-400' },
    Completed: { color: 'bg-green-400', textColor: 'text-green-400' },
  }

  const columns = {
    Pending: projectTasks.filter((t) => t.status === 'Pending'),
    'In Progress': projectTasks.filter((t) => t.status === 'In Progress'),
    'Rework': projectTasks.filter((t) => t.status === 'Rework'),
    Completed: projectTasks.filter((t) => t.status === 'Completed'),
  };

  const handleStatusUpdateClick = (task: Task, newStatus: TaskStatus) => {
    setCurrentTask(task);
    setNextStatus(newStatus);
    setIsStatusUpdateOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-xl font-bold text-white">Project Workflow</h2>
                <p className="text-sm text-muted-foreground">Standard task lifecycle for video production</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'client' || user?.role === 'team') && (
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsManualTaskOpen(true)} className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
                <Button onClick={() => setIsAiTaskOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0">
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Assistant
                </Button>
            </div>
            )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(columns) as Array<keyof typeof columns>).map((status) => (
            <div key={status} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", statusConfig[status].color)} />
                  <h3 className={cn("font-semibold", statusConfig[status].textColor)}>
                    {status}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground ml-1">{columns[status].length}</span>
              </div>
              <div className="rounded-2xl p-4 min-h-[200px] bg-[#13131F] border border-white/5">
                {columns[status].map((task) => <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdateClick} />)}
                {columns[status].length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-muted-foreground text-sm">No tasks in this stage</p>
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
