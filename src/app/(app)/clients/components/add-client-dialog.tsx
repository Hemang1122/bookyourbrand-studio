
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
import type { Client, User } from '@/lib/types';

type AddClientDialogProps = {
  onClientAdd: (name: string, company: string, email: string) => void;
  children: React.ReactNode;
};

export function AddClientDialog({ onClientAdd, children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleAddClient = () => {
    if (!name || !company || !email) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    
    onClientAdd(name, company, email);
    toast({ title: 'Client Added', description: `"${name}" has been added.` });
    setOpen(false);
    // Reset fields
    setName('');
    setCompany('');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the details for the new client.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Industries Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., contact@acme.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClient}>Add Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
