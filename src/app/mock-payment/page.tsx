
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, Building2, CreditCard, Copy, Check, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const name = searchParams.get('name');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const qrImage = PlaceHolderImages.find(img => img.id === 'payment-qr')?.imageUrl;

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    // Simulate transfer verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push(`/payment-success?orderId=${orderId}&txnId=MANUAL_${Date.now()}&amount=${amount}`);
  };

  const handlePaymentFailure = () => {
    router.push(`/payment-failed?reason=user_cancelled&orderId=${orderId}`);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: 'Copied', description: `${field} copied to clipboard.` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="bg-[#13131F] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-pink-500" />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border-2 border-purple-500/20">
            <Building2 className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Checkout</h1>
          <p className="text-gray-400 text-sm">Portal powered by Book Your Brands Agency</p>
        </div>

        {/* Order Summary */}
        <div className="bg-black/40 rounded-2xl p-5 mb-6 space-y-3 border border-white/5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Client</span>
            <span className="text-white font-medium">{decodeURIComponent(name || 'Valued Client')}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Order Ref</span>
            <span className="text-white font-mono text-xs">{orderId}</span>
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-gray-400 font-bold">Total Payable</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500 font-mono">
              ₹{amount}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-6">
          <div className="flex gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20 h-fit">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-bold">Payment Steps:</p>
              <p className="text-blue-200/70 text-xs">Follow these steps to activate your plan:</p>
            </div>
          </div>
          <ol className="text-blue-200/80 text-xs space-y-2 list-decimal list-inside ml-1">
            <li>Transfer the exact amount via UPI or Bank.</li>
            <li>Use the Order ID above as the payment note.</li>
            <li>Click the "I've Completed Payment" button below.</li>
          </ol>
        </div>

        {/* Transfer Details */}
        <div className="space-y-3 mb-8">
          <div className="group relative bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Official UPI ID</p>
                <p className="text-white font-mono text-sm">harshalalani@okhdfcbank</p>
              </div>
              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      title="Show QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#13131F] border-white/10 text-white sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Scan to Pay</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl">
                      {qrImage && (
                        <img 
                          src={qrImage} 
                          alt="UPI QR Code" 
                          className="w-full h-auto mb-4"
                          data-ai-hint="payment qr"
                        />
                      )}
                      <div className="text-center">
                        <p className="text-black text-sm font-bold uppercase tracking-tight">Harsha Lalani</p>
                        <p className="text-gray-500 text-[10px] font-mono">harshalalani@okhdfcbank</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500 hover:text-white"
                  onClick={() => copyToClipboard('harshalalani@okhdfcbank', 'UPI ID')}
                >
                  {copiedField === 'UPI ID' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Bank Transfer Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs">A/C Name</span>
                <span className="text-white font-medium text-xs text-right">Book Your Brands</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs">Bank</span>
                <span className="text-white font-medium text-xs text-right">Bank Of India, Vasai (west)</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs">A/C No.</span>
                <span className="text-white font-mono text-xs text-right">017820110000167</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs">IFSC Code</span>
                <span className="text-white font-mono text-xs text-right">BKID0000178</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handlePaymentSuccess}
            disabled={isProcessing}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-black shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all active:scale-95 group"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                VERIFYING...
              </>
            ) : (
              <>
                <CheckCircle className="mr-3 h-6 w-6" />
                I'VE COMPLETED PAYMENT
              </>
            )}
          </Button>
          
          <Button
            onClick={handlePaymentFailure}
            disabled={isProcessing}
            variant="ghost"
            className="w-full h-12 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 font-bold"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Transaction
          </Button>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-8 uppercase tracking-[0.2em] font-bold">
          SSL Secured & Encrypted
        </p>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  );
}
