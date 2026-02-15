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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseServices } from '@/firebase';

type AddTeamMemberDialogProps = {
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { functions } = useFirebaseServices();


  const handleAddMember = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Name is required.', 
              variant: 'destructive' });
      return;
    }
    if (!functions) {
      toast({ title: 'Error', description: 'Functions service not available.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const createUserFn = httpsCallable(functions, 'createUser');
      const result: any = await createUserFn({ 
        name, 
        role: 'team'
      });
      toast({ 
        title: 'Team Member Created!', 
        description: `Email: ${result.data.email} | Password: ${result.data.password}`,
        duration: 10000,
      });
      setOpen(false);
      setName('');
    } catch (error: any) {
      toast({ 
        title: 'Error creating member', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>Fill in the name for the new team member. Credentials will be generated automatically.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" disabled={isProcessing}/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Adding Member...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
