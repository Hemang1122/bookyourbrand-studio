
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
      // 1. Call Cloud Function to handle user creation/synchronization
      // This handles deterministic credentials and conflict resolution
      const result = await createUser({
        name,
        role: 'client',
        realEmail,
        company
      });

      // 2. Send welcome email via API using the ACTUAL login credentials returned by the backend
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: realEmail,      // Recipient notification address
            username: result.email,   // Generated CRM username (company@creative.co)
            password: result.password, // Generated CRM password (firstname@1234)
            userType: 'client'
          })
        });
        
        toast({
          title: 'Success!',
          description: `Client processed and credentials sent to ${realEmail}.`,
        });
      } catch (emailError) {
        console.error("Email API failed:", emailError);
        toast({
          title: 'Client Ready',
          description: 'Account is synchronized, but email failed. Share manually: ' + result.email,
          variant: 'destructive'
        });
      }

      setOpen(false);
      setName('');
      setCompany('');
      setRealEmail('');
    } catch (error: any) {
      console.error("Failed to process client:", error);
      // Toast error handled in data provider
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add / Update Client</DialogTitle>
          <DialogDescription>
            This will set up a client account with deterministic CRM credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Hemang Tripathi" disabled={isProcessing} autoFocus/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Hemang Tripathi Co" disabled={isProcessing}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Notification Email</Label>
            <Input id="email" type="email" value={realEmail} onChange={(e) => setRealEmail(e.target.value)} placeholder="e.g., hemang@gmail.com" disabled={isProcessing}/>
             <p className="text-xs text-muted-foreground">
              Login credentials will be sent to this inbox.
            </p>
          </div>
        </div>
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Preview Login Details</p>
          <p className="text-xs text-muted-foreground">Username: {company ? company.toLowerCase().replace(/\s+/g, '') : '...'}@creative.co</p>
          <p className="text-xs text-muted-foreground">Password: {name ? name.trim().split(/\s+/)[0].toLowerCase() : '...'}@1234</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isProcessing || !name || !company || !realEmail}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Processing...' : 'Process Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
