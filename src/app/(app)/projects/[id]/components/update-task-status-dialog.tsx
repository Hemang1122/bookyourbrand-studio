
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
import { useData } from '../../../data-provider';
import type { Task, TaskStatus } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type UpdateTaskStatusDialogProps = {
  task: Task;
  newStatus: TaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateTaskStatusDialog({ task, newStatus, open, onOpenChange }: UpdateTaskStatusDialogProps) {
  const [remark, setRemark] = useState('');
  const { updateTaskStatus } = useData();
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!remark.trim()) {
      toast({ title: 'Error', description: 'A remark is required to change the status.', variant: 'destructive' });
      return;
    }
    
    updateTaskStatus(task.id, newStatus, remark);
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setRemark('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            You are about to update the status for "{task.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center gap-4">
                <Badge variant="outline">{task.status}</Badge>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <Badge>{newStatus}</Badge>
            </div>
          <div className="space-y-2">
            <Label htmlFor="remark">Remark (Required)</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={`Add a comment about moving this task to "${newStatus}"...`}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
