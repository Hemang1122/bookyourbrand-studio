'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { useFirebaseServices } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { PREDEFINED_PACKAGES, ADDITIONAL_CHARGES } from '@/lib/packages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PackagesPage() {
  const { user } = useAuth();
  const { clients } = useData();
  const { firestore } = useFirebaseServices();
  const { toast } = useToast();
  
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedReels, setSelectedReels] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [includeAIVoice, setIncludeAIVoice] = useState(false);
  const [includeStockFootage, setIncludeStockFootage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentClient = clients?.find(c => c.id === user?.id);
  const selectedPkg = PREDEFINED_PACKAGES.find(p => p.id === selectedPackageId);
  
  const calculateTotal = () => {
    if (!selectedPkg || !selectedReels || !selectedDuration) return 0;
    const basePrice = selectedPkg.prices[selectedReels]?.[selectedDuration] || 0;
    const extras = (includeAIVoice ? ADDITIONAL_CHARGES.aiVoiceOver : 0) +
                   (includeStockFootage ? ADDITIONAL_CHARGES.stockFootage : 0);
    return basePrice + extras;
  };

  const handleActivatePackage = async () => {
    if (!firestore || !selectedPackageId || !selectedReels || !selectedDuration || !user) {
      toast({ title: 'Configuration Incomplete', description: 'Please select all options before proceeding.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `BYB${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const total = calculateTotal();
      
      const packageDetails = {
        packageName: selectedPkg?.name,
        numberOfReels: selectedReels,
        duration: selectedDuration,
        includeAIVoice,
        includeStockFootage
      };

      // 1. Create PENDING order document in Firestore for verification
      await addDoc(collection(firestore, 'orders'), {
        orderId,
        userId: user.id,
        clientId: user.id,
        amount: total,
        status: 'pending',
        packageDetails,
        createdAt: serverTimestamp()
      });

      // 2. Initiate Manual Payment Processing Flow
      const mockPaymentUrl = `/mock-payment?orderId=${orderId}&amount=${total}&userId=${user.id}&name=${encodeURIComponent(user.name || 'Client')}`;
      
      toast({ title: 'Redirecting...', description: 'Taking you to our secure payment portal.' });
      window.location.href = mockPaymentUrl;

    } catch (error: any) {
      console.error('Payment Flow Error:', error);
      toast({ title: 'Order Error', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'client') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 text-white">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">Client Access Only</h2>
        <p className="text-gray-400 max-w-md">
          This page is for purchasing and managing individual content packages. Please log in as a client to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Content Packages</h1>
          <p className="text-gray-400 text-lg">Select and customize your monthly video production plan.</p>
        </div>
        {currentClient?.currentPackage && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 px-6 flex items-center gap-4">
            <Zap className="text-primary h-6 w-6 animate-pulse" />
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-wider">Active Plan</p>
              <p className="text-white font-bold">
                {currentClient.currentPackage.packageName} ({currentClient.currentPackage.reelsUsed}/{currentClient.currentPackage.numberOfReels} used)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREDEFINED_PACKAGES.map(pkg => (
          <Card
            key={pkg.id}
            className={cn(
              "relative p-8 cursor-pointer transition-all duration-300 bg-[#13131F] border border-white/5 hover:border-primary/40 group",
              selectedPackageId === pkg.id && "ring-2 ring-primary border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
            )}
            onClick={() => {
              setSelectedPackageId(pkg.id);
              setSelectedReels(pkg.reelOptions[0]);
              setSelectedDuration(pkg.durationOptions[0]);
            }}
          >
            <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{pkg.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-4">{pkg.name}</h3>
            <ul className="space-y-3 mb-8">
              {pkg.features?.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {selectedPackageId === pkg.id && (
              <Badge className="absolute top-4 right-4 bg-primary text-white border-0">Selected</Badge>
            )}
          </Card>
        ))}
      </div>

      {selectedPkg && (
        <Card className="p-8 bg-gradient-to-br from-[#13131F] to-[#0F0F1A] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Configure {selectedPkg.name}</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-gray-400 text-xs uppercase font-bold mb-3 block">Volume (Number of Reels)</Label>
                    <RadioGroup value={selectedReels?.toString()} onValueChange={(v) => setSelectedReels(parseInt(v))} className="flex flex-wrap gap-3">
                      {selectedPkg.reelOptions.map(reels => (
                        <div key={reels} className="flex-1 min-w-[80px]">
                          <RadioGroupItem value={reels.toString()} id={`reels-${reels}`} className="sr-only" />
                          <Label
                            htmlFor={`reels-${reels}`}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 cursor-pointer transition-all",
                              selectedReels === reels ? "bg-primary text-white border-primary" : "bg-black/40 text-gray-400 hover:bg-white/5"
                            )}
                          >
                            <span className="text-lg font-bold">{reels}</span>
                            <span className="text-[10px]">Reels</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-gray-400 text-xs uppercase font-bold mb-3 block">Duration (Per Reel)</Label>
                    <RadioGroup value={selectedDuration?.toString()} onValueChange={(v) => setSelectedDuration(parseInt(v))} className="flex flex-wrap gap-3">
                      {selectedPkg.durationOptions.map(duration => (
                        <div key={duration} className="flex-1 min-w-[80px]">
                          <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} className="sr-only" />
                          <Label
                            htmlFor={`duration-${duration}`}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 cursor-pointer transition-all",
                              selectedDuration === duration ? "bg-primary text-white border-primary" : "bg-black/40 text-gray-400 hover:bg-white/5"
                            )}
                          >
                            <span className="text-lg font-bold">{duration}s</span>
                            <span className="text-[10px]">Limit</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-gray-400 text-xs uppercase font-bold mb-3 block">Add-ons</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'ai', label: 'AI Voice Over', price: ADDITIONAL_CHARGES.aiVoiceOver, checked: includeAIVoice, set: setIncludeAIVoice },
                    { id: 'stock', label: 'Stock Footage', price: ADDITIONAL_CHARGES.stockFootage, checked: includeStockFootage, set: setIncludeStockFootage },
                  ].map(addon => (
                    <div
                      key={addon.id}
                      onClick={() => addon.set(!addon.checked)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        addon.checked ? "bg-primary/10 border-primary/40" : "bg-black/20 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{addon.label}</p>
                        <p className="text-xs text-primary">+₹{addon.price}</p>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", addon.checked ? "bg-primary border-primary" : "border-white/20")}>
                        {addon.checked && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Order Summary</span>
                </div>
                
                <div className="space-y-4 border-b border-white/5 pb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{selectedPkg.name} Base</span>
                    <span className="text-white font-mono">₹{selectedPkg.prices[selectedReels!][selectedDuration!].toLocaleString()}</span>
                  </div>
                  {includeAIVoice && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Voice Addition</span>
                      <span className="text-white font-mono">+₹{ADDITIONAL_CHARGES.aiVoiceOver}</span>
                    </div>
                  )}
                  {includeStockFootage && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Premium Stock Footage</span>
                      <span className="text-white font-mono">+₹{ADDITIONAL_CHARGES.stockFootage}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xl font-bold text-white">Total Amount</span>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500 font-mono">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <Button 
                  className="w-full h-16 text-lg font-black bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-[1.02] transition-transform shadow-xl shadow-purple-500/30 rounded-2xl border-0 group" 
                  onClick={handleActivatePackage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      SECURE CONNECTING...
                    </>
                  ) : (
                    <>
                      PROCEED TO PAYMENT
                      <Sparkles className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                  <ShieldCheck className="h-3 w-3" />
                  Secure Transaction SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
