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

type AddClientDialogProps = {
  children: React.ReactNode;
};

export function AddClientDialog({ children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { functions } = useFirebaseServices();

  const handleAddClient = async () => {
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
        role: 'client' 
      });
      toast({ 
        title: 'Client Created!', 
        description: `Email: ${result.data.email} | Password: ${result.data.password}`,
        duration: 10000,
      });
      setOpen(false);
      setName('');
    } catch (error: any) {
      toast({ 
        title: 'Error creating client', 
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
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the name for the new client. Credentials will be generated automatically.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" disabled={isProcessing} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Adding Client...' : 'Add Client'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
