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
import { useFirebaseServices } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { sendWelcomeEmailAction } from '@/app/actions/email';

type AddClientDialogProps = {
  children: React.ReactNode;
};

export function AddClientDialog({ children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const { toast } = useToast();
  const { firestore, functions } = useFirebaseServices();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddClient = async () => {
    if (!name || !company || !realEmail) {
      toast({ title: 'Error', description: 'Name, company and email are required.', variant: 'destructive' });
      return;
    }
    
    if (!firestore || !functions) return;

    setIsProcessing(true);
    try {
      let userId = null;
      let generatedPassword = Math.random().toString(36).slice(-8); // Generate random password

      // 1. Process Auth User via Cloud Function
      try {
        const createUserFn = httpsCallable(functions, 'createUser');
        const result: any = await createUserFn({ 
          name, 
          role: 'client', 
          realEmail 
        });
        
        userId = result.data.uid;
        generatedPassword = result.data.password;
        console.log('✅ User record processed:', userId);
      } catch (authError: any) {
        // Handle existing users
        if (authError.message?.includes('already exists') || authError.code === 'already-exists') {
          console.log('⚠️ User already exists, finding record...');
          
          const usersRef = collection(firestore, 'users');
          const q = query(usersRef, where('name', '==', name));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            userId = snapshot.docs[0].id;
          } else {
            throw new Error('User conflict. Please use a different name.');
          }
        } else {
          throw authError;
        }
      }

      if (!userId) throw new Error("Could not determine User ID");

      // 2. Update Firestore Documents (Merge to avoid overwriting)
      await setDoc(doc(firestore, 'users', userId), {
        id: userId,
        email: realEmail,
        name: name,
        role: 'client',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(firestore, 'clients', userId), {
        id: userId,
        email: realEmail,
        name: name,
        company: company,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 3. Trigger Welcome Email via Server Action (Replaces problematic API fetch)
      const emailResult = await sendWelcomeEmailAction(name, realEmail, generatedPassword);
      
      if (emailResult.success) {
        toast({
          title: 'Success!',
          description: `Client created and credentials sent to ${realEmail}.`,
        });
      } else {
        toast({
          title: 'Client Created',
          description: 'Account created, but credentials email failed. Please share manually.',
          variant: 'destructive'
        });
      }

      setOpen(false);
      setName('');
      setCompany('');
      setRealEmail('');
    } catch (error: any) {
      console.error("Failed to create client:", error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
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
              Credentials and updates will be sent to this address.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isProcessing || !name || !company || !realEmail}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Processing...' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
