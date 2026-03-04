'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useFirebaseServices } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/firebase/provider';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firestore } = useFirebaseServices();
  const { user } = useAuth();
  
  const [isActivating, setIsActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');
  const packageName = searchParams.get('packageName');
  const reels = parseInt(searchParams.get('reels') || '0');
  const duration = parseInt(searchParams.get('duration') || '0');
  const amount = parseFloat(searchParams.get('amount') || '0');

  useEffect(() => {
    async function activatePackage() {
      if (!firestore || !user || !orderId) return;

      try {
        console.log('Activating package for user:', user.id);
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

        const activePackage = {
          clientId: user.id,
          packageName: decodeURIComponent(packageName || 'Bronze'),
          numberOfReels: reels,
          duration: duration,
          price: amount,
          reelsUsed: 0,
          startDate: serverTimestamp(),
          expiryDate: Timestamp.fromDate(expiryDate),
          status: 'active',
          paymentId: txnId,
          createdAt: serverTimestamp()
        };

        // 1. Add to client-packages collection
        const pkgRef = await addDoc(collection(firestore, 'client-packages'), activePackage);

        // 2. Update Client document
        const clientRef = doc(firestore, 'clients', user.id);
        await updateDoc(clientRef, {
          currentPackage: { ...activePackage, id: pkgRef.id },
          reelsLimit: reels,
          packageName: activePackage.packageName,
          maxDuration: duration,
          reelsCreated: 0
        });

        // 3. Update User document for UI sync
        const userRef = doc(firestore, 'users', user.id);
        await updateDoc(userRef, {
          packageName: activePackage.packageName,
          reelsLimit: reels
        });

        setIsActivating(false);
      } catch (err: any) {
        console.error('Activation failed:', err);
        setError(err.message);
        setIsActivating(false);
      }
    }

    activatePackage();
  }, [firestore, user, orderId, txnId, packageName, reels, duration, amount]);

  if (isActivating) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Activating Your Package...</h2>
        <p className="text-gray-400 text-sm">Please do not close this window.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-400 mb-2">Activation Error</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#13131F] border border-white/10 rounded-3xl p-10 text-center shadow-2xl relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Payment Success!</h1>
            <p className="text-gray-400">Your package has been activated and is ready to use.</p>
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="text-white font-mono text-xs">{txnId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Active Plan</span>
              <span className="text-green-400 font-bold">{decodeURIComponent(packageName || '')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Reels Quota</span>
              <span className="text-white font-bold">{reels} Reels</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg hover:scale-[1.02] transition-transform"
            >
              Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-purple-400 font-medium">
            <Sparkles className="h-3 w-3" />
            Happy Creating!
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
