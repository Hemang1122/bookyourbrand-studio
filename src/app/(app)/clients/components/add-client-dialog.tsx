
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
  const [agreementLink, setAgreementLink] = useState('');
  const [idCardLink, setIdCardLink] = useState('');
  const { toast } = useToast();

  const handleAddClient = () => {
    if (!name || !company || !email || !agreementLink || !idCardLink) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    
    // In a real app, you would save these links.
    onClientAdd(name, company, email);
    toast({ title: 'Client Added', description: `"${name}" has been added.` });
    setOpen(false);
    // Reset fields
    setName('');
    setCompany('');
    setEmail('');
    setFounderDetails('');
    setAgreementLink('');
    setIdCardLink('');
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
            <Label htmlFor="agreement">Client Agreement Link (Required)</Label>
            <Input id="agreement" value={agreementLink} onChange={e => setAgreementLink(e.target.value)} placeholder="https://link.to/agreement.pdf" required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="identity-card">Founder's Identity Card Link (Required)</Label>
            <Input id="identity-card" value={idCardLink} onChange={e => setIdCardLink(e.target.value)} placeholder="https://link.to/id-card.pdf" required />
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
