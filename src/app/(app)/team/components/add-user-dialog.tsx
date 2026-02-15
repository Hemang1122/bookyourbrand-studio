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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AddUserDialogProps = {
  children: React.ReactNode;
};

type Role = 'client' | 'team';

export function AddUserDialog({ children }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [realEmail, setRealEmail] = useState('');
  const { toast } = useToast();
  const { createUser } = useData();
  const [isProcessing, setIsProcessing] = useState(false);

  const { email, password } = useMemo(() => {
    if (!name) return { email: '', password: '' };
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const domain = role === 'client' ? 'creative.co' : 'example.com';
    return {
      email: `${cleanName}@${domain}`,
      password: `${cleanName}@1234`,
    };
  }, [name, role]);

  const handleAddUser = async () => {
    if (!name || !role) {
      toast({ title: 'Error', description: 'Name and role are required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await createUser({ name, role, realEmail: realEmail || undefined });
      toast({
        title: 'User Created Successfully!',
        description: realEmail 
          ? `Login credentials sent to ${realEmail}`
          : `Email: ${result.email} | Password: ${result.password}`,
        duration: 10000,
      });
      setOpen(false);
      setName('');
      setRole('client');
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
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            This will create a new Firebase account and a corresponding profile in Firestore.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" disabled={isProcessing} autoFocus/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: Role) => setRole(value)} disabled={isProcessing}>
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="team">Editor (Team)</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="realEmail">
              Real Email Address
              <span className="text-muted-foreground text-xs ml-1">
                (optional — for sending credentials)
              </span>
            </Label>
            <Input
              id="realEmail"
              type="email"
              value={realEmail}
              onChange={(e) => setRealEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              disabled={isProcessing}
            />
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
            {isProcessing ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
