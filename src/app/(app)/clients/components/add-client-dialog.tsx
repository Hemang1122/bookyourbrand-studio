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

      // Try to create Firebase Auth user via Cloud Function (prevents signing out Admin)
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
        // If user already exists, find them instead (Matching the "already-in-use" logic)
        if (authError.message?.includes('already exists') || authError.code === 'already-exists') {
          console.log('⚠️ User already exists, checking Firestore...');
          
          const usersRef = collection(firestore, 'users');
          // Note: The function generates an email like name@creative.co, but we check by name or provided realEmail
          const q = query(usersRef, where('name', '==', name));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            userId = snapshot.docs[0].id;
            console.log('✅ Found existing user record:', userId);
          } else {
            throw new Error('User record conflict. Please use a different name.');
          }
        } else {
          throw authError;
        }
      }

      if (!userId) throw new Error("Could not determine User ID");

      // Create or update Firestore documents using Merge
      await setDoc(doc(firestore, 'users', userId), {
        id: userId,
        email: realEmail, // Use their actual email for the profile
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

      console.log('✅ Client documents merged');

      // Send welcome email via our new API
      try {
        const response = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: realEmail,
            password: generatedPassword
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log('✅ Welcome email sent to', realEmail);
          toast({
            title: 'Success!',
            description: `Client created and credentials sent to ${realEmail}.`,
          });
        }
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        toast({
          title: 'Client Created',
          description: 'Client created but welcome email failed to send.',
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
