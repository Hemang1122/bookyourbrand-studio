
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
  onTeamMemberAdd: (name: string, email: string, username: string, password?: string) => void;
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ onTeamMemberAdd, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleAddMember = () => {
    if (!name || !email || !username || !password) {
      toast({ title: 'Error', description: 'Name, email, username, and password are required.', variant: 'destructive' });
      return;
    }
    
    // In a real app, you would handle the file uploads here.
    // For now, we're just adding the user data.
    
    onTeamMemberAdd(name, email, username, password);
    toast({ title: 'Team Member Added', description: `"${name}" has been added.` });
    setOpen(false);
    // Reset fields
    setName('');
    setEmail('');
    setUsername('');
    setPassword('');
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
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., john_d" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a secure password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhar">Aadhar Card (Required)</Label>
            <Input id="aadhar" type="file" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Card</Label>
            <Input id="pan" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joining-letter">Joining Letter</Label>
            <Input id="joining-letter" type="file" />
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
