
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
import { packages } from '../packages-data';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Client, PackageName } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useData } from '../../../data-provider';
import { Loader2 } from 'lucide-react';
import { packages as subscriptionPackages } from '../packages-data';

type UpgradeDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function UpgradeDialog({ client, children }: UpgradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageName | undefined>(client.packageName);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { updateClient } = useData();

  const handlePayment = () => {
    if (!selectedPackage) {
      toast({ title: 'Error', description: 'Please select a package to continue.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const pkg = subscriptionPackages.find(p => p.name === selectedPackage);
      if (pkg) {
         const tier = pkg.tiers?.[0]; // Default to the first tier
         const durationString = tier?.duration || pkg.duration;
         const maxDuration = durationString ? parseInt(durationString.replace(/[^0-9]/g, ''), 10) : 0;
         
         const remainingProjects = (client.reelsLimit || 0) - (client.reelsCreated || 0);
         const newReelsLimit = (tier?.reels || 0) + (remainingProjects > 0 ? remainingProjects : 0);

         const clientUpdate: Partial<Client> = {
            packageName: selectedPackage,
            reelsLimit: newReelsLimit,
         };

         if (!isNaN(maxDuration)) {
            clientUpdate.maxDuration = maxDuration;
         }

         updateClient(client.id, clientUpdate);
      }
      
      toast({
        title: 'Upgrade Successful!',
        description: `Your plan has been upgraded to ${selectedPackage}. Payment gateway integration is pending.`,
      });
      setIsProcessing(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Subscription</DialogTitle>
          <DialogDescription>You've reached your project limit. Choose a new plan to continue creating.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Package Selection */}
            <div className='space-y-4'>
                <h4 className="font-semibold">Select a Plan</h4>
                 <RadioGroup value={selectedPackage} onValueChange={(val: PackageName) => setSelectedPackage(val)} className="space-y-2">
                    {packages.filter(p => p.tiers).map((pkg) => (
                        <Label key={pkg.name} htmlFor={pkg.name} className={cn(
                            "flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent",
                            selectedPackage === pkg.name && "ring-2 ring-primary"
                        )}>
                            <RadioGroupItem value={pkg.name} id={pkg.name} />
                            <pkg.icon className={cn("w-6 h-6", pkg.color)} />
                            <div className="flex-1">
                                <p className="font-bold">{pkg.name} Plan</p>
                                <p className="text-sm text-muted-foreground">{pkg.tiers?.[0].reels} Reels, {pkg.tiers?.[0].duration}</p>
                            </div>
                            <p className="font-bold text-lg">₹{pkg.tiers?.[0].price}/-</p>
                        </Label>
                    ))}
                </RadioGroup>
            </div>
            {/* Payment Details */}
            <div className='space-y-4'>
                <h4 className="font-semibold">Payment Information</h4>
                 <Card>
                    <CardHeader>
                        <CardTitle>Confirm Your Details</CardTitle>
                        <CardDescription>Please confirm your details before proceeding to payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={client.name} readOnly />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" value={client.email} readOnly />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handlePayment} disabled={isProcessing || !selectedPackage}>
             {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Processing...' : 'Make Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
