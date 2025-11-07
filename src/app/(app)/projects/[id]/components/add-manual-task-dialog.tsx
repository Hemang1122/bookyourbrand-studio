
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type AddManualTaskDialogProps = {
  projectId: string;
  onTaskAdd: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks'>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddManualTaskDialog({ projectId, onTaskAdd, open, onOpenChange }: AddManualTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const { toast } = useToast();

  const handleAddTask = () => {
    if (!title || !startDate) {
        toast({ title: 'Error', description: 'Task title and start date are required.', variant: 'destructive'});
        return;
    }
    const newTask = {
        projectId: projectId,
        title,
        description,
        startDate: format(startDate, 'yyyy-MM-dd'),
        dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 week from start date
    };
    onTaskAdd(newTask);
    toast({ title: 'Task Added', description: `"${title}" has been added to the project.` });
    
    handleClose();
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTitle('');
    setDescription('');
    setStartDate(undefined);
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
           <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
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
