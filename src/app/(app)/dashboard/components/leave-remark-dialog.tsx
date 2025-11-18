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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type LeaveRemarkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveRemark: (remark: string) => void;
  remarkType: 'hours' | 'scrum' | 'reporting';
  currentRemark?: string;
};

const remarkTitles = {
    hours: 'Work Hours Remark',
    scrum: 'Scrum Submission Remark',
    reporting: 'Admin Reporting Remark'
};

const remarkDescriptions = {
    hours: "Explain why you might not meet the 8-hour goal today.",
    scrum: "Explain why you couldn't submit the scrum sheet.",
    reporting: "Explain why you were unable to report to the admin today."
}

export function LeaveRemarkDialog({ open, onOpenChange, onSaveRemark, remarkType, currentRemark }: LeaveRemarkDialogProps) {
  const [remark, setRemark] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setRemark(currentRemark || '');
    }
  }, [open, currentRemark]);

  const handleSave = () => {
    onSaveRemark(remark);
    toast({ title: 'Remark Saved', description: 'Your remark has been noted for the day.' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{remarkTitles[remarkType]}</DialogTitle>
          <DialogDescription>
            {remarkDescriptions[remarkType]} Your response will be saved for today.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="remark-textarea">Your Remark</Label>
                <Textarea
                    id="remark-textarea"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Type your explanation here..."
                    rows={5}
                    autoFocus
                />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Remark</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
