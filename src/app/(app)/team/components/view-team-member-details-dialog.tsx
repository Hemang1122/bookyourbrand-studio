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
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);

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
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p><Badge variant={teamMember.role === 'admin' ? 'default' : 'secondary'}>{teamMember.role}</Badge></p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Documents</h4>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">aadhar_card.pdf</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">pan_card.pdf</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">joining_letter.pdf</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
