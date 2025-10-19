
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';
import { Input } from '@/components/ui/input';

type AddManualTaskDialogProps = {
  projectId: string;
  onTaskAdd: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddManualTaskDialog({ projectId, onTaskAdd, open, onOpenChange }: AddManualTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleAddTask = () => {
    if (!title) {
        toast({ title: 'Error', description: 'Task title is required.', variant: 'destructive'});
        return;
    }
    const newTask = {
        projectId: projectId,
        title,
        description,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 week from now
    };
    onTaskAdd(newTask);
    toast({ title: 'Task Added', description: `"${title}" has been added to the project.` });
    
    handleClose();
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTitle('');
    setDescription('');
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add a New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for the new task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g., Design new homepage mockup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Task Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details about the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
                Cancel
            </Button>
            <Button onClick={handleAddTask}>Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
