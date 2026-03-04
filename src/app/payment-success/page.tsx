'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth, useFirebaseServices } from '@/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { firestore } = useFirebaseServices();
  
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');
  const amount = searchParams.get('amount');
  
  const [isActivating, setIsActivating] = useState(true);
  const [activationComplete, setActivationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activatePackage = async () => {
      if (!firestore || !orderId || !user) {
        if (!firestore) console.error('Firestore not initialized');
        setIsActivating(false);
        return;
      }

      try {
        console.log('Starting activation for order:', orderId);

        // 1. Save payment record
        await addDoc(collection(firestore, 'payments'), {
          orderId,
          userId: user.id,
          amount: parseFloat(amount || '0'),
          status: 'success',
          method: 'mock',
          transactionId: txnId,
          paidAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });

        // 2. Update order status
        const ordersRef = collection(firestore, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          const orderData = orderDoc.data();

          if (orderData.status === 'paid') {
            console.log('Order already processed');
            setActivationComplete(true);
            setIsActivating(false);
            return;
          }

          await updateDoc(orderDoc.ref, {
            status: 'paid',
            paidAt: serverTimestamp(),
            transactionId: txnId
          });

          // 3. Activate package for the client
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

          const packageData = {
            clientId: user.id,
            packageName: orderData.packageDetails?.packageName || 'Custom Package',
            numberOfReels: orderData.packageDetails?.numberOfReels || 10,
            duration: orderData.packageDetails?.duration || 30,
            price: parseFloat(amount || '0'),
            reelsUsed: 0,
            startDate: serverTimestamp(),
            expiryDate: Timestamp.fromDate(expiryDate),
            status: 'active',
            paymentId: txnId,
            includeAIVoice: orderData.packageDetails?.includeAIVoice || false,
            includeStockFootage: orderData.packageDetails?.includeStockFootage || false,
            createdAt: serverTimestamp()
          };

          // Add to client-packages collection
          const packageRef = await addDoc(collection(firestore, 'client-packages'), packageData);

          // Update client's current package
          await updateDoc(doc(firestore, 'clients', user.id), {
            currentPackage: { ...packageData, id: packageRef.id },
            reelsLimit: packageData.numberOfReels,
            packageName: packageData.packageName,
            maxDuration: packageData.duration,
            reelsCreated: 0
          });

          // Update user document for dashboard sync
          await updateDoc(doc(firestore, 'users', user.id), {
            packageName: packageData.packageName,
            reelsLimit: packageData.numberOfReels
          });

          console.log('Package activated successfully!');
          setActivationComplete(true);
        } else {
          console.warn('No matching order found for ID:', orderId);
          setError('Order details could not be found.');
        }

        setIsActivating(false);

      } catch (error: any) {
        console.error('Error activating package:', error);
        setError(error.message || 'An unexpected error occurred during activation.');
        setIsActivating(false);
      }
    };

    activatePackage();
  }, [firestore, orderId, user, amount, txnId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] to-[#1a0533] p-4">
      <div className="bg-[#13131F] border border-green-500/20 rounded-2xl p-12 max-w-md w-full text-center shadow-2xl">
        {isActivating ? (
          <>
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Activating Your Package...</h1>
            <p className="text-gray-400 text-sm">Please wait while we set up your account</p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Activation Issue</h1>
            <p className="text-red-400 text-sm mb-8">{error}</p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">Return to Dashboard</Button>
          </>
        ) : (
          <>
            <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-green-500/20 animate-in zoom-in">
              <CheckCircle className="h-14 w-14 text-green-400" />
            </div>
            
            <div className="mb-6">
              <Sparkles className="h-8 w-8 text-yellow-400 mx-auto mb-2 animate-pulse" />
              <h1 className="text-3xl font-bold text-white mb-2">Success!</h1>
              <p className="text-green-400 font-medium">Your package is now active</p>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID:</span>
                <span className="text-white font-mono truncate max-w-[150px]">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction:</span>
                <span className="text-white font-mono truncate max-w-[150px]">{txnId}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-green-400 font-bold text-xl">₹{amount}</span>
              </div>
            </div>

            {activationComplete && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
                <p className="text-green-200 text-sm">
                  ✓ Quota updated! You can now start creating reels.
                </p>
              </div>
            )}

            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-6 text-lg hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg"
            >
              Start Creating
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}