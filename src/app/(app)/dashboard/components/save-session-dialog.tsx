
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { TimerSession } from '@/lib/types';
import { format } from 'date-fns';

type SaveSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  session: Omit<TimerSession, 'name' | 'date'>;
};

export function SaveSessionDialog({ open, onOpenChange, onSave, session }: SaveSessionDialogProps) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please provide a name for the session.', variant: 'destructive' });
      return;
    }
    onSave(name);
    onOpenChange(false);
  };
  
  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  const duration = session.endTime ? session.endTime - session.startTime : 0;
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Work Session</DialogTitle>
          <DialogDescription>
            Give this session a name to remember what you worked on.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Session Duration</p>
                <p className="text-sm font-mono font-semibold">{formatTime(duration)}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                    id="session-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Worked on Project X feature"
                    autoFocus
                />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
