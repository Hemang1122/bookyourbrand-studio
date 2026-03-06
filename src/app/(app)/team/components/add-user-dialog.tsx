'use client';
import { useState, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AddUserDialogProps = {
  children: React.ReactNode;
};

export function AddUserDialog({ children }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const { toast } = useToast();
  const { createUser } = useData();
  const [isProcessing, setIsProcessing] = useState(false);

  // Generation Logic: Deterministic pattern for Team Members
  const credentials = useMemo(() => {
    if (!name) return { email: '', password: '', username: '' };
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    return {
      username: cleanName,
      email: `${cleanName}@example.com`,
      password: `${cleanName}@1234`,
    };
  }, [name]);

  const handleAddUser = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Create team member in Firebase via Cloud Function
      const result = await createUser({ 
        name, 
        role: 'team', 
        realEmail: realEmail || undefined 
      });
      
      // 2. Send welcome email via API
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: realEmail || result.email, // Use provided notification email or the generated one
            username: credentials.email,
            password: credentials.password,
            userType: 'team'
          })
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }

      toast({
        title: 'Team Member Created!',
        description: realEmail 
          ? `Login credentials sent to ${realEmail}`
          : `Email: ${result.email} | Password: ${result.password}`,
        duration: 10000,
      });
      
      setOpen(false);
      setName('');
      setRealEmail('');
    } catch (error) {
      console.error("Failed to create team member:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            This will create a new team member account (Editor).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" disabled={isProcessing} autoFocus/>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">
              Notification Email <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Input
              type="email"
              value={realEmail}
              onChange={(e) => setRealEmail(e.target.value)}
              placeholder="member@gmail.com"
              className="bg-white/5 border-white/10 text-white"
              disabled={isProcessing}
            />
             <p className="text-xs text-muted-foreground">
              Used to send login credentials to the member.
            </p>
          </div>
          {name && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle className="text-primary font-bold">Generated Credentials Preview</AlertTitle>
              <AlertDescription className="break-all mt-2 space-y-1">
                <p><b>Login Email:</b> {credentials.email}</p>
                <p><b>Initial Password:</b> {credentials.password}</p>
                <p className="text-[10px] text-muted-foreground mt-2 italic">Note: These are based on the team name pattern.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddUser} disabled={isProcessing || !name}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'Creating...' : 'Create Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}