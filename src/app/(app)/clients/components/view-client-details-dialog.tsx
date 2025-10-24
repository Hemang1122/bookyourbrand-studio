
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Client } from '@/lib/types';
import { FileText, Download, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import { useData } from '../../data-provider';

type ViewClientDetailsDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ViewClientDetailsDialog({ client, children }: ViewClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateClient } = useData();
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleFileUpload = async (file: File, type: 'agreement' | 'idCard') => {
    setIsUploading(type);
    try {
      const url = await uploadFile(file, `documents/clients/${client.id}`);
      const fieldToUpdate = type === 'agreement' ? 'agreementUrl' : 'idCardUrl';
      
      updateClient(client.id, { [fieldToUpdate]: url });

      toast({ title: 'Upload Successful', description: `${type} document uploaded.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Upload Failed', description: `Could not upload ${type} document.`, variant: 'destructive' });
    } finally {
      setIsUploading(null);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'agreement' | 'idCard') => {
    const file = e.target.files?.[0];
    if (file) {
        handleFileUpload(file, type);
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Client Details: {client.name}</DialogTitle>
          <DialogDescription>Viewing details for {client.company}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Client Name</p>
            <p>{client.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Company Name</p>
            <p>{client.company}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email Address</p>
            <p>{client.email}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Founder Details</h4>
            <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                {client.founderDetails || "No details provided."}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Documents</h4>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">client_agreement.pdf</span>
                    </div>
                    {client.agreementUrl ? (
                         <Button variant="outline" size="sm" onClick={() => handleDownload(client.agreementUrl!)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                         <Button asChild variant="secondary" size="sm" disabled={isUploading === 'agreement'}>
                            <label htmlFor="agreement-upload-view" className="cursor-pointer">
                                {isUploading === 'agreement' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                                 <Input id="agreement-upload-view" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'agreement')} />
                            </label>
                        </Button>
                    )}
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">founder_id_card.pdf</span>
                    </div>
                     {client.idCardUrl ? (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(client.idCardUrl!)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                     ) : (
                        <Button asChild variant="secondary" size="sm" disabled={isUploading === 'idCard'}>
                            <label htmlFor="id-card-upload-view" className="cursor-pointer">
                                {isUploading === 'idCard' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                                <Input id="id-card-upload-view" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'idCard')} />
                            </label>
                        </Button>
                     )}
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
