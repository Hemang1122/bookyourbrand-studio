
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { uploadFile } from '@/lib/storage';

type AddClientDialogProps = {
  onClientAdd: (clientData: {
    name: string;
    company: string;
    email: string;
    founderDetails: string;
    agreementUrl?: string;
    idCardUrl?: string;
  }) => void;
  children: React.ReactNode;
};

export function AddClientDialog({ onClientAdd, children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [founderDetails, setFounderDetails] = useState('');
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddClient = async () => {
    if (!name || !company || !email) {
      toast({ title: 'Error', description: 'Name, company, and email are required.', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);

    try {
      let agreementUrl: string | undefined;
      let idCardUrl: string | undefined;

      if (agreementFile) {
        agreementUrl = await uploadFile(agreementFile, `documents/clients/${name}`, () => {});
      }
      if (idCardFile) {
        idCardUrl = await uploadFile(idCardFile, `documents/clients/${name}`, () => {});
      }

      onClientAdd({ name, company, email, founderDetails, agreementUrl, idCardUrl });
      toast({ title: 'Client Added', description: `"${name}" has been added.` });
      setOpen(false);
      // Reset fields
      setName('');
      setCompany('');
      setEmail('');
      setFounderDetails('');
      setAgreementFile(null);
      setIdCardFile(null);
    } catch (error) {
        console.error(error);
        toast({ title: 'Upload Error', description: 'Could not upload files.', variant: 'destructive'});
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the details for the new client.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" disabled={isUploading} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Industries Inc." disabled={isUploading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., contact@acme.com" disabled={isUploading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="founder-details">Founder Details</Label>
            <Textarea id="founder-details" value={founderDetails} onChange={(e) => setFounderDetails(e.target.value)} placeholder="Enter details about the founder(s)." disabled={isUploading}/>
          </div>
           <div className="space-y-2">
            <Label>Client Agreement</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="agreement-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="agreement-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAgreementFile)} disabled={isUploading} />
                {agreementFile && <span className="text-sm text-muted-foreground truncate">{agreementFile.name}</span>}
            </div>
          </div>
           <div className="space-y-2">
            <Label>Founder's Identity Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="id-card-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="id-card-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setIdCardFile)} disabled={isUploading}/>
                {idCardFile && <span className="text-sm text-muted-foreground truncate">{idCardFile.name}</span>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Adding Client...' : 'Add Client'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
