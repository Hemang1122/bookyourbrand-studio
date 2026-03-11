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
import { Trash2 } from 'lucide-react';
import { useData } from '../../data-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { deleteUser } = useData();
  
  const handleDeleteConfirmed = async () => {
    await deleteUser(teamMember.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team Member Details: {teamMember.name}</DialogTitle>
          <DialogDescription>Viewing profile information for {teamMember.email}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p className="text-white font-semibold">{teamMember.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-white">{teamMember.email}</p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Role</div>
            <div><Badge variant={teamMember.role === 'admin' ? 'default' : 'secondary'}>{teamMember.role}</Badge></div>
          </div>
          
          <div className="pt-4 border-t border-white/5">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Team Account
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This will permanently delete {teamMember.name}'s account and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
