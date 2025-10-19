
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
import type { User } from '@/lib/types';
import { FileText, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  
  // This is a mock download handler. In a real app, this would trigger a download from cloud storage.
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
          <DialogTitle>Team Member Details: {teamMember.name}</DialogTitle>
          <DialogDescription>Viewing details for {teamMember.email}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p>{teamMember.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{teamMember.email}</p>
          </div>
           <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p><Badge variant={teamMember.role === 'admin' ? 'default' : 'secondary'}>{teamMember.role}</Badge></p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Documents</h4>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">aadhar_card.pdf</span>
                    </div>
                     {teamMember.aadharUrl ? (
                        <Button variant="outline" size="sm" onClick={() => handleDownload('aadhar_card.pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                     ) : (
                         <Button asChild variant="secondary" size="sm">
                            <label htmlFor="aadhar-upload-view" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                                <Input id="aadhar-upload-view" type="file" className="hidden" onChange={() => handleUpload('aadhar')} />
                            </label>
                        </Button>
                     )}
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">pan_card.pdf</span>
                    </div>
                    {teamMember.panUrl ? (
                        <Button variant="outline" size="sm" onClick={() => handleDownload('pan_card.pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                        <Button asChild variant="secondary" size="sm">
                            <label htmlFor="pan-upload-view" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                                <Input id="pan-upload-view" type="file" className="hidden" onChange={() => handleUpload('pan')} />
                            </label>
                        </Button>
                    )}
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">joining_letter.pdf</span>
                    </div>
                    {teamMember.joiningLetterUrl ? (
                         <Button variant="outline" size="sm" onClick={() => handleDownload('joining_letter.pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                         <Button asChild variant="secondary" size="sm">
                            <label htmlFor="joining-letter-upload-view" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                                <Input id="joining-letter-upload-view" type="file" className="hidden" onChange={() => handleUpload('joining-letter')} />
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
