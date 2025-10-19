
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
import { Upload } from 'lucide-react';

type AddClientDialogProps = {
  onClientAdd: (name: string, company: string, email: string) => void;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddClient = () => {
    if (!name || !company || !email) {
      toast({ title: 'Error', description: 'Name, company, and email are required.', variant: 'destructive' });
      return;
    }
    
    // In a real app, you would upload the files here.
    console.log({
        agreementFile: agreementFile?.name,
        idCardFile: idCardFile?.name,
    });
    
    onClientAdd(name, company, email);
    toast({ title: 'Client Added', description: `"${name}" has been added.` });
    setOpen(false);
    // Reset fields
    setName('');
    setCompany('');
    setEmail('');
    setFounderDetails('');
    setAgreementFile(null);
    setIdCardFile(null);
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Industries Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., contact@acme.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="founder-details">Founder Details</Label>
            <Textarea id="founder-details" value={founderDetails} onChange={(e) => setFounderDetails(e.target.value)} placeholder="Enter details about the founder(s)." />
          </div>
           <div className="space-y-2">
            <Label>Client Agreement</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <label htmlFor="agreement-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="agreement-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAgreementFile)} />
                {agreementFile && <span className="text-sm text-muted-foreground truncate">{agreementFile.name}</span>}
            </div>
          </div>
           <div className="space-y-2">
            <Label>Founder's Identity Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <label htmlFor="id-card-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="id-card-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setIdCardFile)} />
                {idCardFile && <span className="text-sm text-muted-foreground truncate">{idCardFile.name}</span>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClient}>Add Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
