'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Project, ProjectStatus } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Safe date formatter helper
const formatDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      return date.toDate();
    }
    // Handle date string or Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
    return parsedDate;
  } catch (error) {
    return null;
  }
};

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdate: (projectId: string, updates: any) => void;
  children: React.ReactNode;
}

export function EditProjectDialog({
  project,
  onProjectUpdate,
  children
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [guidelines, setGuidelines] = useState(project?.guidelines || '');
  const [deadline, setDeadline] = useState<Date | null>(formatDate(project?.deadline));
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'Active');
  const [isSaving, setIsSaving] = useState(false);

  // Update form when project changes or dialog opens
  useEffect(() => {
    if (open && project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setGuidelines(project.guidelines || '');
      setDeadline(formatDate(project.deadline));
      setStatus(project.status || 'Active');
    }
  }, [open, project]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updates: any = {
        name,
        description,
        guidelines,
        status,
      };

      // Only add deadline if it's a valid date
      if (deadline) {
        updates.deadline = deadline.toISOString();
      }

      await onProjectUpdate(project.id, updates);
      setOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the details for this project.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          {/* Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="guidelines">Project Guidelines</Label>
            <Textarea
              id="guidelines"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Enter project guidelines"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Deadline */}
            <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={deadline || undefined}
                    onSelect={(date) => setDeadline(date || null)}
                    initialFocus
                    />
                </PopoverContent>
                </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value: ProjectStatus) => setStatus(value)} value={status}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Rework">Rework</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
