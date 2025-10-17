'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddTaskDialog } from './add-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Wand2 } from 'lucide-react';
import { useData } from '../../../data-provider';
import { useAuth } from '@/lib/auth-client';

type TaskListProps = {
  projectId: string;
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
        {Object.entries(columns).map(([status, tasksInColumn]) => (
          <div key={status} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold tracking-tight">
              {status} <span className="text-sm text-muted-foreground">({tasksInColumn.length})</span>
            </h3>
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
              {tasksInColumn.map((task) => {
                const userAvatar = PlaceHolderImages.find(img => img.id === task.assignedTo.avatar);
                return (
                    <Card key={task.id} className="bg-background">
                        <CardHeader className="p-4">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between p-4 pt-0">
                            <Badge variant="outline">Due: {task.dueDate}</Badge>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={userAvatar?.imageUrl} alt={task.assignedTo.name} data-ai-hint={userAvatar?.imageHint}/>
                                <AvatarFallback>{task.assignedTo.name.charAt(0)}</AvatarFallback>
                            </Avatar>
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
