'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, ShieldCheck, IndianRupee } from 'lucide-react';

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const userId = searchParams.get('userId');
  const name = searchParams.get('name');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    
    // Simulate gateway processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Construct the success URL
    const successUrl = `/payment-success?orderId=${orderId}&txnId=MOCK_${Date.now()}&amount=${amount}`;
    router.push(successUrl);
  };

  const handlePaymentFailure = () => {
    router.push(`/payment-failed?reason=user_cancelled&orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="bg-[#13131F] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-500" />
        
        <div className="flex items-center justify-center gap-2 mb-8 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Secure Test Checkout</span>
        </div>

        <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/20">
          <IndianRupee className="h-10 w-10 text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Demo Payment Gateway</h1>
        <p className="text-gray-400 text-sm mb-8">This is a sandbox environment for testing.</p>
        
        <div className="bg-black/40 rounded-2xl p-6 mb-8 space-y-4 border border-white/5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Customer</span>
            <span className="text-white font-medium">{decodeURIComponent(name || 'Valued Client')}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="text-white font-mono text-xs">{orderId}</span>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-gray-400 font-bold">Payable Amount</span>
            <span className="text-2xl font-black text-white">₹{amount}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePaymentSuccess}
            disabled={isProcessing}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-lg font-bold shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                VERIFYING...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                COMPLETE PAYMENT
              </>
            )}
          </Button>
          
          <Button
            onClick={handlePaymentFailure}
            disabled={isProcessing}
            variant="ghost"
            className="w-full text-gray-500 hover:text-red-400 hover:bg-red-500/5"
          >
            Cancel and Return
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-gray-600 uppercase tracking-widest">
            Powered by MockPay v1.0
        </div>
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