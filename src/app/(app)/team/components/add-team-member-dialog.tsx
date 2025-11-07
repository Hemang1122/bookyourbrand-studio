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
import { Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { uploadFile } from '@/lib/storage';

type AddTeamMemberDialogProps = {
  onTeamMemberAdd: (memberData: {
    name: string;
    email: string;
    password: string;
    aadharUrl?: string;
    panUrl?: string;
    joiningLetterUrl?: string;
  }) => Promise<void>;
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ onTeamMemberAdd, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [joiningLetterFile, setJoiningLetterFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setAadharFile(null);
    setPanFile(null);
    setJoiningLetterFile(null);
    setShowPassword(false);
  };

  const handleAddMember = async () => {
    if (!name || !email || !password) {
      toast({ title: 'Error', description: 'Name, email, and password are required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);

    try {
      let aadharUrl, panUrl, joiningLetterUrl;

      if (aadharFile) {
        aadharUrl = await uploadFile(aadharFile, `documents/team/${name}`);
      }
      if (panFile) {
        panUrl = await uploadFile(panFile, `documents/team/${name}`);
      }
      if (joiningLetterFile) {
        joiningLetterUrl = await uploadFile(joiningLetterFile, `documents/team/${name}`);
      }

      await onTeamMemberAdd({ name, email, password, aadharUrl, panUrl, joiningLetterUrl });
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
          
          <div className="space-y-2">
            <Label>Aadhar Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isProcessing}>
                    <label htmlFor="aadhar-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="aadhar-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAadharFile)} disabled={isProcessing}/>
                {aadharFile && <span className="text-sm text-muted-foreground truncate">{aadharFile.name}</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>PAN Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isProcessing}>
                    <label htmlFor="pan-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="pan-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setPanFile)} disabled={isProcessing}/>
                {panFile && <span className="text-sm text-muted-foreground truncate">{panFile.name}</span>}
            </div>
          </div>

           <div className="space-y-2">
            <Label>Joining Letter</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isProcessing}>
                    <label htmlFor="joining-letter-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="joining-letter-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setJoiningLetterFile)} disabled={isProcessing}/>
                {joiningLetterFile && <span className="text-sm text-muted-foreground truncate">{joiningLetterFile.name}</span>}
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
