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
import { users } from '@/lib/data';
import type { Project } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { useData } from '../../../data-provider';

type ManageTeamDialogProps = {
  project: Project;
  children: React.ReactNode;
};

export function ManageTeamDialog({ project, children }: ManageTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState<string[]>(project.team.map(t => t.id));
  const { updateProjectTeam } = useData();
  const { toast } = useToast();

  const teamMembers = users.filter(u => u.role === 'team');
  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));

  const handleUpdateTeam = () => {
    if (team.length === 0) {
      toast({ title: 'Error', description: 'A project must have at least one team member.', variant: 'destructive' });
      return;
    }
    
    updateProjectTeam(project.id, team);
    toast({ title: 'Team Updated', description: `The team for "${project.name}" has been updated.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Team for {project.name}</DialogTitle>
          <DialogDescription>Add or remove team members from this project.</DialogDescription>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateTeam}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
