
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
import { FileText, Download, Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useData } from '../../data-provider';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

type ViewTeamMemberDetailsDialogProps = {
  teamMember: User;
  children: React.ReactNode;
};

export function ViewTeamMemberDetailsDialog({ teamMember, children }: ViewTeamMemberDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateTeamMember } = useData();
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleFileUpload = async (file: File, type: 'aadhar' | 'pan' | 'joiningLetter') => {
    setIsUploading(type);
    setUploadProgress(0);
    try {
      const url = await uploadFile(file, `documents/team/${teamMember.id}`, setUploadProgress);
      const fieldToUpdate = `${type}Url` as const;
      
      updateTeamMember(teamMember.id, { [fieldToUpdate]: url });

      toast({ title: 'Upload Successful', description: `${type} document uploaded.` });
    } catch (error) {
      toast({ title: 'Upload Failed', description: `Could not upload ${type} document.`, variant: 'destructive' });
    } finally {
      setIsUploading(null);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhar' | 'pan' | 'joiningLetter') => {
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
                        <Button variant="outline" size="sm" onClick={() => handleDownload(teamMember.aadharUrl!)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                     ) : (
                         <Button asChild variant="secondary" size="sm" disabled={isUploading === 'aadhar'}>
                            <label htmlFor="aadhar-upload-view" className="cursor-pointer">
                                {isUploading === 'aadhar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                                <Input id="aadhar-upload-view" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'aadhar')} />
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
                        <Button variant="outline" size="sm" onClick={() => handleDownload(teamMember.panUrl!)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                        <Button asChild variant="secondary" size="sm" disabled={isUploading === 'pan'}>
                            <label htmlFor="pan-upload-view" className="cursor-pointer">
                                {isUploading === 'pan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                                <Input id="pan-upload-view" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'pan')} />
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
                         <Button variant="outline" size="sm" onClick={() => handleDownload(teamMember.joiningLetterUrl!)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    ) : (
                         <Button asChild variant="secondary" size="sm" disabled={isUploading === 'joiningLetter'}>
                            <label htmlFor="joining-letter-upload-view" className="cursor-pointer">
                                {isUploading === 'joiningLetter' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload File
                                <Input id="joining-letter-upload-view" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'joiningLetter')} />
                            </label>
                        </Button>
                    )}
                </div>
                {isUploading && (
                    <div className="space-y-2 mt-2">
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground text-center">Uploading... {Math.round(uploadProgress)}%</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
