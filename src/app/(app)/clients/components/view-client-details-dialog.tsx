
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
import { Label } from '@/components/ui/label';
import type { Client } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ViewClientDetailsDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ViewClientDetailsDialog({ client, children }: ViewClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  // This is a mock download handler. In a real app, this would trigger a download.
  const handleDownload = (fileName: string) => {
    alert(`Downloading ${fileName}... (simulation)`);
  };

  const handleUpload = (fileType: string) => {
    alert(`Uploading ${fileType}... (simulation)`);
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
                         <Button variant="outline" size="sm" onClick={() => handleDownload('client_agreement.pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                         <Button asChild variant="secondary" size="sm">
                            <label htmlFor="agreement-upload-view" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                                 <Input id="agreement-upload-view" type="file" className="hidden" onChange={() => handleUpload('agreement')} />
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
                        <Button variant="outline" size="sm" onClick={() => handleDownload('founder_id_card.pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                     ) : (
                        <Button asChild variant="secondary" size="sm">
                            <label htmlFor="id-card-upload-view" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                                <Input id="id-card-upload-view" type="file" className="hidden" onChange={() => handleUpload('id-card')} />
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
