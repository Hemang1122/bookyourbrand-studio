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

  const { email, password } = useMemo(() => {
    if (!name) return { email: '', password: '' };
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const domain = 'example.com';
    return {
      email: `${cleanName}@${domain}`,
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
      const result = await createUser({ name, role: 'team', realEmail: realEmail || undefined });
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
      // Error toast is handled in the data provider
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
            />
             <p className="text-xs text-muted-foreground">
              Login credentials will be sent here.
            </p>
          </div>
          {name && (
            <Alert>
              <AlertTitle>Generated Credentials Preview</AlertTitle>
              <AlertDescription className="break-all">
                <p><b>Login Email:</b> {email}</p>
                <p><b>Initial Password:</b> {password}</p>
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
