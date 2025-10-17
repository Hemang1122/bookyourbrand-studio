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
import { FileText } from 'lucide-react';

type ViewClientDetailsDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ViewClientDetailsDialog({ client, children }: ViewClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);

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
                {/* In a real app, this would show the founder details text */}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
                    <Button variant="outline" size="sm">View</Button>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">founder_id_card.pdf</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
