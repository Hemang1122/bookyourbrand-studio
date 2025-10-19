
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
import { File, Upload } from 'lucide-react';

type AddTeamMemberDialogProps = {
  onTeamMemberAdd: (name: string, email: string) => void;
  children: React.ReactNode;
};

export function AddTeamMemberDialog({ onTeamMemberAdd, children }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [joiningLetterFile, setJoiningLetterFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddMember = () => {
    if (!name || !email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    
    // In a real app, you would upload the files here.
    // For now, we just pass the names.
    console.log({
      aadharFile: aadharFile?.name,
      panFile: panFile?.name,
      joiningLetterFile: joiningLetterFile?.name,
    });

    onTeamMemberAdd(name, email);
    setOpen(false);
    // Reset fields
    setName('');
    setEmail('');
    setAadharFile(null);
    setPanFile(null);
    setJoiningLetterFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>Fill in the details for the new team member.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.d@example.com" />
          </div>
          
          <div className="space-y-2">
            <Label>Aadhar Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <label htmlFor="aadhar-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="aadhar-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAadharFile)} />
                {aadharFile && <span className="text-sm text-muted-foreground truncate">{aadharFile.name}</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>PAN Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <label htmlFor="pan-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="pan-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setPanFile)} />
                {panFile && <span className="text-sm text-muted-foreground truncate">{panFile.name}</span>}
            </div>
          </div>

           <div className="space-y-2">
            <Label>Joining Letter</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <label htmlFor="joining-letter-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="joining-letter-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setJoiningLetterFile)} />
                {joiningLetterFile && <span className="text-sm text-muted-foreground truncate">{joiningLetterFile.name}</span>}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember}>Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
