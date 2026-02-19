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
import { useData } from '../../data-provider';

type AddClientDialogProps = {
  children: React.ReactNode;
};

export function AddClientDialog({ children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const { toast } = useToast();
  const { createUser } = useData();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddClient = async () => {
    if (!name || !company || !realEmail) {
      toast({ title: 'Error', description: 'Name, company and email are required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      await createUser({ name, role: 'client', realEmail });
      toast({
        title: 'Client Created Successfully!',
        description: `Login credentials have been sent to ${realEmail}.`,
        duration: 10000,
      });
      setOpen(false);
      setName('');
      setCompany('');
      setRealEmail('');
    } catch (error: any) {
      console.error("Failed to create client", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            This will create a new client account and send their login credentials via email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Inc." disabled={isProcessing} autoFocus/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Industries Inc." disabled={isProcessing}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input id="email" type="email" value={realEmail} onChange={(e) => setRealEmail(e.target.value)} placeholder="e.g., contact@acme.com" disabled={isProcessing}/>
             <p className="text-xs text-muted-foreground">
              Project updates and credentials will be sent here.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isProcessing || !name || !company || !realEmail}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
