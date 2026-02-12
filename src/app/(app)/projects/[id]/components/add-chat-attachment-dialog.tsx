
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

type AddChatAttachmentDialogProps = {
  onAddAttachment: (url: string, message: string) => void;
  children: React.ReactNode;
};

export function AddChatAttachmentDialog({ onAddAttachment, children }: AddChatAttachmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleAddLink = () => {
    if (!url) {
      toast({ title: 'Error', description: 'File URL is required.', variant: 'destructive' });
      return;
    }
    
    try {
        new URL(url); // Validate URL format
    } catch (_) {
        toast({ title: 'Error', description: 'Please enter a valid URL.', variant: 'destructive' });
        return;
    }

    onAddAttachment(url, message);
    setOpen(false);
    // Reset fields
    setUrl('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Attach a File Link</DialogTitle>
          <DialogDescription>Add a link to an externally hosted file and an optional message.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="space-y-2">
            <Label htmlFor="url">File URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
           <div className="space-y-2">
            <Label htmlFor="message">Optional Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a comment about the file..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink}>Add Attachment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
