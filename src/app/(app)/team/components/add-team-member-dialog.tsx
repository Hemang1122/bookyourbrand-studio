
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
import { Loader2, Upload } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

type AddTeamMemberDialogProps = {
  onTeamMemberAdd: (memberData: {
    name: string;
    email: string;
    aadharUrl?: string;
    panUrl?: string;
    joiningLetterUrl?: string;
  }) => void;
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddMember = async () => {
    if (!name || !email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let aadharUrl, panUrl, joiningLetterUrl;
      const totalFiles = (aadharFile ? 1 : 0) + (panFile ? 1 : 0) + (joiningLetterFile ? 1 : 0);
      let filesUploaded = 0;

      if (aadharFile) {
        aadharUrl = await uploadFile(aadharFile, `documents/team/${name}`, p => setUploadProgress((filesUploaded * 100 + p) / totalFiles));
        filesUploaded++;
      }
      if (panFile) {
        panUrl = await uploadFile(panFile, `documents/team/${name}`, p => setUploadProgress((filesUploaded * 100 + p) / totalFiles));
        filesUploaded++;
      }
      if (joiningLetterFile) {
        joiningLetterUrl = await uploadFile(joiningLetterFile, `documents/team/${name}`, p => setUploadProgress((filesUploaded * 100 + p) / totalFiles));
        filesUploaded++;
      }

      onTeamMemberAdd({ name, email, aadharUrl, panUrl, joiningLetterUrl });
      toast({ title: 'Team Member Added', description: `"${name}" has been added.` });
      
      setOpen(false);
      // Reset fields
      setName('');
      setEmail('');
      setAadharFile(null);
      setPanFile(null);
      setJoiningLetterFile(null);
      
    } catch (error) {
      console.error(error);
      toast({ title: 'Upload Error', description: 'Could not upload files.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" disabled={isUploading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.d@example.com" disabled={isUploading}/>
          </div>
          
          <div className="space-y-2">
            <Label>Aadhar Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="aadhar-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="aadhar-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAadharFile)} disabled={isUploading}/>
                {aadharFile && <span className="text-sm text-muted-foreground truncate">{aadharFile.name}</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>PAN Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="pan-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="pan-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setPanFile)} disabled={isUploading}/>
                {panFile && <span className="text-sm text-muted-foreground truncate">{panFile.name}</span>}
            </div>
          </div>

           <div className="space-y-2">
            <Label>Joining Letter</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="joining-letter-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="joining-letter-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setJoiningLetterFile)} disabled={isUploading}/>
                {joiningLetterFile && <span className="text-sm text-muted-foreground truncate">{joiningLetterFile.name}</span>}
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
