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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { useData } from '../../../data-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ManageTeamDialogProps = {
  project: Project;
  children: React.ReactNode;
};

export function ManageTeamDialog({ project, children }: ManageTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState<string[]>(project.team_ids);
  const [startDate, setStartDate] = useState<Date | undefined>(project.startDate ? new Date(project.startDate) : new Date());
  const { teamMembers, updateProjectTeam, updateProject } = useData();
  const { toast } = useToast();

  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));

  const handleUpdate = () => {
    if (team.length === 0) {
      toast({ title: 'Error', description: 'A project must have at least one team member.', variant: 'destructive' });
      return;
    }
    if (!startDate) {
      toast({ title: 'Error', description: 'Please select a start date.', variant: 'destructive' });
      return;
    }
    
    updateProjectTeam(project.id, team);
    updateProject(project.id, { startDate: format(startDate, 'yyyy-MM-dd') });

    toast({ title: 'Project Updated', description: `The team and start date for "${project.name}" have been updated.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Team for {project.name}</DialogTitle>
          <DialogDescription>Assign team members and set the project start date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Assign Team Members</Label>
            <MultiSelect
              options={teamMemberOptions}
              selected={team}
              onChange={setTeam}
              placeholder="Select team members..."
            />
          </div>
           <div className="space-y-2">
              <Label htmlFor="start-date">Project Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
