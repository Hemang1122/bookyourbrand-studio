
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

type AddTeamMemberDialogProps = {
  onTeamMemberAdd: (name: string, email: string) => void;
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ onTeamMemberAdd, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [aadharLink, setAadharLink] = useState('');
  const [panLink, setPanLink] = useState('');
  const [joiningLetterLink, setJoiningLetterLink] = useState('');
  const { toast } = useToast();

  const handleAddMember = () => {
    if (!name || !email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    
    onTeamMemberAdd(name, email);
    setOpen(false);
    // Reset fields
    setName('');
    setEmail('');
    setAadharLink('');
    setPanLink('');
    setJoiningLetterLink('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>Fill in the details for the new team member.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.d@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhar">Aadhar Card Link</Label>
            <Input id="aadhar" value={aadharLink} onChange={e => setAadharLink(e.target.value)} placeholder="https://link.to/aadhar.pdf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Card Link</Label>
            <Input id="pan" value={panLink} onChange={e => setPanLink(e.target.value)} placeholder="https://link.to/pan.pdf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joining-letter">Joining Letter Link</Label>
            <Input id="joining-letter" value={joiningLetterLink} onChange={e => setJoiningLetterLink(e.target.value)} placeholder="https://link.to/letter.pdf" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember}>Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
