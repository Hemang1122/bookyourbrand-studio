
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useData } from '../../data-provider';
import { useToast } from '@/hooks/use-toast';

type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateTeamMember } = useData();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Team Member Details: {teamMember.name}</DialogTitle>
          <DialogDescription>Viewing details for {teamMember.email}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p>{teamMember.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{teamMember.email}</p>
          </div>
           <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Role</div>
            <div><Badge variant={teamMember.role === 'admin' ? 'default' : 'secondary'}>{teamMember.role}</Badge></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
