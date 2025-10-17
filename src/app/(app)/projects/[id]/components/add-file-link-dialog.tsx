
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

type AddFileLinkDialogProps = {
  onAddFile: (name: string, url: string) => void;
  children: React.ReactNode;
};

export function AddFileLinkDialog({ onAddFile, children }: AddFileLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const handleAddLink = () => {
    if (!name || !url) {
      toast({ title: 'Error', description: 'File name and URL are required.', variant: 'destructive' });
      return;
    }
    
    try {
        new URL(url); // Validate URL format
    } catch (_) {
        toast({ title: 'Error', description: 'Please enter a valid URL.', variant: 'destructive' });
        return;
    }

    onAddFile(name, url);
    setOpen(false);
    // Reset fields
    setName('');
    setUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add File Link</DialogTitle>
          <DialogDescription>Add a link to an externally hosted file (e.g., Google Drive, Dropbox).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">File Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Final Video Edit.mp4" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="url">File URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink}>Add Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
