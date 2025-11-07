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
import { Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { uploadFile } from '@/lib/storage';

type AddClientDialogProps = {
  onClientAdd: (clientData: {
    name: string;
    company: string;
    email: string;
    password: string;
    founderDetails: string;
    agreementUrl?: string;
    idCardUrl?: string;
  }) => Promise<void>;
  children: React.ReactNode;
};

export function AddClientDialog({ onClientAdd, children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [founderDetails, setFounderDetails] = useState('');
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const resetForm = () => {
    setName('');
    setCompany('');
    setEmail('');
    setPassword('');
    setFounderDetails('');
    setAgreementFile(null);
    setIdCardFile(null);
    setShowPassword(false);
  }

  const handleAddClient = async () => {
    if (!name || !company || !email || !password) {
      toast({ title: 'Error', description: 'Name, company, email, and password are required.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);

    try {
      let agreementUrl: string | undefined;
      let idCardUrl: string | undefined;

      if (agreementFile) {
        agreementUrl = await uploadFile(agreementFile, `documents/clients/${name}`);
      }
      if (idCardFile) {
        idCardUrl = await uploadFile(idCardFile, `documents/clients/${name}`);
      }

      await onClientAdd({ name, company, email, password, founderDetails, agreementUrl, idCardUrl });
      toast({ title: 'Client Added', description: `"${name}" has been added.` });
      setOpen(false);
      resetForm();

    } catch (error: any) {
        console.error(error);
        toast({ title: 'Error Adding Client', description: error.message || 'Could not add client.', variant: 'destructive'});
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the details for the new client. This will create a new user account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Corp" disabled={isProcessing} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Industries Inc." disabled={isProcessing}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., contact@acme.com" disabled={isProcessing}/>
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
            <Label htmlFor="founder-details">Founder Details</Label>
            <Textarea id="founder-details" value={founderDetails} onChange={(e) => setFounderDetails(e.target.value)} placeholder="Enter details about the founder(s)." disabled={isProcessing}/>
          </div>
           <div className="space-y-2">
            <Label>Client Agreement</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isProcessing}>
                    <label htmlFor="agreement-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="agreement-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setAgreementFile)} disabled={isProcessing} />
                {agreementFile && <span className="text-sm text-muted-foreground truncate">{agreementFile.name}</span>}
            </div>
          </div>
           <div className="space-y-2">
            <Label>Founder's Identity Card</Label>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={isProcessing}>
                    <label htmlFor="id-card-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
                <Input id="id-card-upload" type="file" className="hidden" onChange={e => handleFileChange(e, setIdCardFile)} disabled={isProcessing}/>
                {idCardFile && <span className="text-sm text-muted-foreground truncate">{idCardFile.name}</span>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleAddClient} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Adding Client...' : 'Add Client'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
