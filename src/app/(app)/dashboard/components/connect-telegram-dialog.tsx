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
import { Loader2 } from 'lucide-react';
import type { Client } from '@/lib/types';
import Link from 'next/link';

type ConnectTelegramDialogProps = {
  client: Client;
  onSave: (clientId: string, data: Partial<Client>) => void;
  children: React.ReactNode;
};

// Replace with your actual bot username
const TELEGRAM_BOT_USERNAME = 'your_bot_username';

export function ConnectTelegramDialog({ client, onSave, children }: ConnectTelegramDialogProps) {
  const [open, setOpen] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState(client.telegramChatId || '');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!telegramChatId) {
      toast({ title: 'Error', description: 'Telegram Chat ID is required.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);

    try {
      await onSave(client.id, { telegramChatId });
      toast({ title: 'Telegram Connected', description: 'You will now receive notifications on Telegram.' });
      setOpen(false);
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not save your Telegram Chat ID.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect to Telegram</DialogTitle>
          <DialogDescription>Get real-time project updates directly in Telegram.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-3">
               <p>
                1. Click the button below to open a chat with our notification bot on Telegram.
               </p>
                <Button asChild className="w-full">
                    <Link href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} target="_blank">
                        Open Telegram Bot
                    </Link>
                </Button>
               <p>
                2. In the chat with the bot, send the command <code className="font-mono bg-background px-1 py-0.5 rounded">/start</code>.
               </p>
                <p>
                3. The bot will reply with your unique Chat ID. Copy that ID and paste it in the field below.
                </p>
            </div>
          <div className="space-y-2">
            <Label htmlFor="chat-id">Your Telegram Chat ID</Label>
            <Input id="chat-id" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Paste your Chat ID here" disabled={isLoading} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save and Connect'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
