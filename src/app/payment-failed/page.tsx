'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle, RefreshCw } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get('reason');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#13131F] border border-white/10 rounded-3xl p-10 text-center shadow-2xl relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20">
          <XCircle className="h-12 w-12 text-white" />
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Payment Failed</h1>
            <p className="text-gray-400">
              {reason === 'user_cancelled' ? 'Transaction was cancelled by the user.' : 'Something went wrong during the transaction process.'}
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-left">If money was deducted from your account, it will be refunded within 5-7 working days.</p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => router.push('/packages')}
              className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="mr-2 h-5 w-5" /> Try Again
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => router.push('/support')}
              className="w-full text-gray-500 hover:text-white"
            >
              Contact Support
            </Button>
          </div>
          
          <p className="text-xs text-gray-600 uppercase tracking-widest font-mono">
            Order Ref: {orderId || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
