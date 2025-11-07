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
import { Loader2, Eye, EyeOff } from 'lucide-react';

type AddTeamMemberDialogProps = {
  onTeamMemberAdd: (memberData: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ onTeamMemberAdd, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleAddMember = async () => {
    if (!name || !email || !password) {
      toast({ title: 'Error', description: 'Name, email, and password are required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);

    try {
      await onTeamMemberAdd({ name, email, password });
      toast({ title: 'Team Member Added', description: `"${name}" has been added.` });
      
      setOpen(false);
      resetForm();
      
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error Adding Member', description: error.message || 'Could not add team member.', variant: 'destructive' });
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
          <DialogDescription>Fill in the details for the new team member. This will create a new user account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" disabled={isProcessing}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.d@example.com" disabled={isProcessing}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Set Initial Password</Label>
            <div className="relative">
                <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Must be at least 6 characters"
                disabled={isProcessing}
                />
                <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full px-3"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isProcessing}
                >
                {showPassword ? <EyeOff /> : <Eye />}
                </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
