
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
import type { Client, PackageName } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '../../data-provider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { packages as subscriptionPackages } from '../../settings/billing/packages-data';


type ViewClientDetailsDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ViewClientDetailsDialog({ client, children }: ViewClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateClient } = useData();
  const [selectedPackage, setSelectedPackage] = useState<PackageName | undefined>(client.packageName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSubscription = async () => {
    if (!selectedPackage) {
        toast({ title: "Error", description: "Please select a package.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    const pkg = subscriptionPackages.find(p => p.name === selectedPackage);
    
    if (pkg) {
      const tier = pkg.tiers?.[0]; // Default to the first tier for simplicity
      const durationString = tier?.duration || pkg.duration;
      const maxDuration = durationString ? parseInt(durationString.replace(/[^0-9]/g, ''), 10) : 0;
      
      const newReelsLimit = tier?.reels ? parseInt(tier.reels.toString(), 10) : 0;

      const clientUpdate: Partial<Client> = {
        packageName: pkg.name as PackageName,
        reelsLimit: newReelsLimit,
        reelsCreated: 0, // Reset created count on plan change
      };

      if (!isNaN(maxDuration)) {
        clientUpdate.maxDuration = maxDuration;
      }
      
      await updateClient(client.id, clientUpdate);
      toast({ title: "Subscription Updated", description: `${client.name}'s plan set to ${pkg.name}.` });
    }
    
    setIsSaving(false);
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Client Details: {client.name}</DialogTitle>
          <DialogDescription>Viewing details for {client.company}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-medium">Subscription Plan</h4>
             <div className="space-y-2">
                <Label htmlFor="package-select">Package</Label>
                <Select
                    value={selectedPackage}
                    onValueChange={(value: PackageName) => setSelectedPackage(value)}
                >
                    <SelectTrigger id="package-select">
                        <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                        {subscriptionPackages.map(pkg => (
                           pkg.tiers && <SelectItem key={pkg.name} value={pkg.name}>{pkg.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <Button onClick={handleSaveSubscription} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Subscription
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Founder Details</h4>
            <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                {client.founderDetails || "No details provided."}
            </p>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
