'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useFirebaseServices } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firestore: db, auth } = useFirebaseServices();
  const currentUser = auth?.currentUser;
  
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');
  const amount = searchParams.get('amount');
  
  const [isActivating, setIsActivating] = useState(true);
  const [activationComplete, setActivationComplete] = useState(false);

  useEffect(() => {
    const activatePackage = async () => {
      if (!orderId || !currentUser || !db) {
        setIsActivating(false);
        return;
      }

      try {
        // 1. Save local payment record for audit
        await addDoc(collection(db, 'payments'), {
          orderId,
          userId: currentUser.uid,
          amount: parseFloat(amount || '0'),
          status: 'success',
          method: 'phonepe_v2',
          transactionId: txnId,
          paidAt: serverTimestamp()
        });

        // 2. Locate and verify the order in Firestore
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          const orderData = orderDoc.data();

          if (orderData.status !== 'paid') {
            await updateDoc(orderDoc.ref, {
              status: 'paid',
              paidAt: serverTimestamp(),
              transactionId: txnId
            });

            // 3. Provision the package locally (backup logic if callback is slow)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            const packageData = {
              clientId: currentUser.uid,
              packageName: orderData.packageDetails?.packageName || 'Custom Package',
              numberOfReels: orderData.packageDetails?.numberOfReels || 10,
              duration: orderData.packageDetails?.duration || 30,
              price: parseFloat(amount || (orderData.amount).toString()),
              reelsUsed: 0,
              startDate: serverTimestamp(),
              expiryDate: expiryDate,
              status: 'active',
              paymentId: txnId,
              createdAt: serverTimestamp()
            };

            const packageRef = await addDoc(collection(db, 'client-packages'), packageData);

            await updateDoc(doc(db, 'clients', currentUser.uid), {
              currentPackage: { ...packageData, id: packageRef.id },
              reelsLimit: packageData.numberOfReels,
              packageName: packageData.packageName,
              maxDuration: packageData.duration,
              reelsCreated: 0
            });

            await updateDoc(doc(db, 'users', currentUser.uid), {
              packageName: packageData.packageName,
              reelsLimit: packageData.numberOfReels
            });
          }
        }

        setActivationComplete(true);
        setIsActivating(false);

      } catch (error) {
        console.error('Error activating package on success page:', error);
        setIsActivating(false);
      }
    };

    activatePackage();
  }, [orderId, currentUser, amount, txnId, db]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] to-[#1a0533] p-4">
      <div className="bg-[#13131F] border border-green-500/20 rounded-2xl p-12 max-w-md w-full text-center shadow-2xl">
        {isActivating ? (
          <>
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h1>
            <p className="text-gray-400 text-sm">Activating your package configuration</p>
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
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white font-mono text-xs">{orderId?.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-green-400 font-bold text-xl">₹{amount}</span>
              </div>
            </div>

            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-6 text-lg hover:from-purple-700 hover:to-pink-600"
            >
              Go to Dashboard
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] to-[#1a0533]">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
