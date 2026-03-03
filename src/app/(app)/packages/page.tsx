'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';
import { PREDEFINED_PACKAGES, ADDITIONAL_CHARGES } from '@/lib/packages';
import { cn } from '@/lib/utils';

export default function PackagesPage() {
  const { user } = useAuth();
  const { clients, selectPackage } = useData();
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

  const handleSelectPackage = async () => {
    if (!selectedPkg || !selectedReels || !selectedDuration) return;
    
    setIsSubmitting(true);
    try {
      await selectPackage({
        packageName: selectedPkg.name,
        numberOfReels: selectedReels,
        duration: selectedDuration,
        price: calculateTotal(),
        extras: {
          aiVoiceOver: includeAIVoice,
          stockFootage: includeStockFootage
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'client') {
    return <div className="p-8">Only clients can access packages.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Package</h1>
        <p className="text-gray-400">Select the perfect package for your content needs</p>
      </div>

      {currentClient?.currentPackage && (
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-pink-500/10 border-primary/20">
          <h3 className="font-semibold mb-2">Current Package</h3>
          <p className="text-2xl font-bold mb-2">{currentClient.currentPackage.packageName}</p>
          <div className="flex gap-4 text-sm">
            <span>{currentClient.currentPackage.numberOfReels} reels</span>
            <span>•</span>
            <span>{currentClient.currentPackage.duration}s duration</span>
            <span>•</span>
            <span className="text-primary font-medium">
              {currentClient.reelsCreated || 0}/{currentClient.currentPackage.numberOfReels} used
            </span>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {PREDEFINED_PACKAGES.map(pkg => (
          <Card
            key={pkg.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:scale-[1.02]",
              selectedPackageId === pkg.id && "border-primary border-2 shadow-lg shadow-primary/20"
            )}
            onClick={() => {
              setSelectedPackageId(pkg.id);
              setSelectedReels(null);
              setSelectedDuration(null);
            }}
          >
            <div className="text-4xl mb-3">{pkg.icon}</div>
            <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
            <ul className="space-y-2 mb-4">
              {pkg.features?.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {selectedPackageId === pkg.id && (
              <Badge className="mt-2">Selected</Badge>
            )}
          </Card>
        ))}
      </div>

      {selectedPkg && (
        <Card className="p-6 mb-8 bg-[#13131F] border-white/5">
          <h3 className="text-xl font-bold mb-4">Configure Your {selectedPkg.name} Package</h3>
          
          <div className="mb-6">
            <Label className="mb-3 block text-base">Number of Reels</Label>
            <RadioGroup value={selectedReels?.toString()} onValueChange={(v) => setSelectedReels(parseInt(v))}>
              <div className="flex flex-wrap gap-4">
                {selectedPkg.reelOptions.map(reels => (
                  <div key={reels} className="flex items-center space-x-2">
                    <RadioGroupItem value={reels.toString()} id={`reels-${reels}`} />
                    <Label htmlFor={`reels-${reels}`} className="cursor-pointer">{reels} reels</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {selectedReels && (
            <div className="mb-6">
              <Label className="mb-3 block text-base">Duration per Reel</Label>
              <RadioGroup value={selectedDuration?.toString()} onValueChange={(v) => setSelectedDuration(parseInt(v))}>
                <div className="flex flex-wrap gap-4">
                  {selectedPkg.durationOptions.map(duration => (
                    <div key={duration} className="flex items-center space-x-2">
                      <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                      <Label htmlFor={`duration-${duration}`} className="cursor-pointer">Up to {duration}s</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {selectedReels && selectedDuration && (
            <>
              <div className="space-y-4 mb-6">
                <Label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeAIVoice}
                    onChange={(e) => setIncludeAIVoice(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Add AI Voice Over</p>
                    <p className="text-xs text-muted-foreground">+₹{ADDITIONAL_CHARGES.aiVoiceOver}</p>
                  </div>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeStockFootage}
                    onChange={(e) => setIncludeStockFootage(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Add Stock Footage</p>
                    <p className="text-xs text-muted-foreground">+₹{ADDITIONAL_CHARGES.stockFootage}</p>
                  </div>
                </Label>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg">Total Estimated Price:</span>
                  <span className="text-3xl font-bold text-white">
                    ₹{calculateTotal().toLocaleString()}/-
                  </span>
                </div>
                <Button 
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 border-0" 
                  onClick={handleSelectPackage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select This Package'
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      <p className="text-sm text-gray-400 text-center">
        * All reels will be delivered within 48-72 working hours from content submission.
      </p>
    </div>
  );
}
