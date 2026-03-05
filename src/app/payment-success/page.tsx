'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase locally for direct use in this component
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txnId');
  const amount = searchParams.get('amount');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isActivating, setIsActivating] = useState(true);
  const [activationComplete, setActivationComplete] = useState(false);

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ id: user.uid, email: user.email });
      } else {
        // If not logged in after 2 seconds, stop activating
        const timer = setTimeout(() => {
          if (!auth.currentUser) setIsActivating(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, []);

  // Activate package
  useEffect(() => {
    const activatePackage = async () => {
      if (!orderId || !currentUser) {
        return;
      }

      try {
        console.log('Activating package for order:', orderId);

        // 1. Save payment record for accounting
        await addDoc(collection(db, 'payments'), {
          orderId,
          userId: currentUser.id,
          amount: parseFloat(amount || '0'),
          status: 'success',
          method: 'manual_transfer',
          transactionId: txnId || `MANUAL_${Date.now()}`,
          paidAt: serverTimestamp()
        });

        // 2. Find and update the pending order
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          const orderData = orderDoc.data();

          await updateDoc(orderDoc.ref, {
            status: 'paid',
            paidAt: serverTimestamp(),
            transactionId: txnId || `MANUAL_${Date.now()}`
          });

          // 3. Create the new package subscription
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

          const packageData = {
            clientId: currentUser.id,
            packageName: orderData.packageDetails?.packageName || 'Custom Package',
            numberOfReels: orderData.packageDetails?.numberOfReels || 10,
            duration: orderData.packageDetails?.duration || 30,
            price: parseFloat(amount || '0'),
            reelsUsed: 0,
            startDate: serverTimestamp(),
            expiryDate: expiryDate,
            status: 'active',
            paymentId: txnId || `MANUAL_${Date.now()}`,
            includeAIVoice: orderData.packageDetails?.includeAIVoice || false,
            includeStockFootage: orderData.packageDetails?.includeStockFootage || false,
            createdAt: serverTimestamp()
          };

          // Add to client-packages history
          const packageRef = await addDoc(collection(db, 'client-packages'), packageData);

          // 4. Update the client's primary record with new limits
          const clientRef = doc(db, 'clients', currentUser.id);
          await updateDoc(clientRef, {
            currentPackage: { ...packageData, id: packageRef.id },
            reelsLimit: packageData.numberOfReels,
            packageName: packageData.packageName,
            maxDuration: packageData.duration,
            reelsCreated: 0 // Reset usage counter for the new plan
          }).catch(err => console.log('Client doc update failed:', err));

          // 5. Update user document for UI consistency
          const userRef = doc(db, 'users', currentUser.id);
          await updateDoc(userRef, {
            packageName: packageData.packageName,
            reelsLimit: packageData.numberOfReels
          }).catch(err => console.log('User doc update failed:', err));

          setActivationComplete(true);
        } else {
          console.error('Order document not found in Firestore:', orderId);
        }

        setIsActivating(false);

      } catch (error) {
        console.error('Critical Error during package activation:', error);
        setIsActivating(false);
      }
    };

    if (currentUser && isActivating) {
      activatePackage();
    }
  }, [orderId, currentUser, amount, txnId, isActivating]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] to-[#1a0533] p-4">
      <div className="bg-[#13131F] border border-green-500/20 rounded-2xl p-12 max-w-md w-full text-center shadow-2xl">
        {isActivating ? (
          <>
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Activating Your Package...</h1>
            <p className="text-gray-400 text-sm">Please wait while we set up your workspace</p>
          </>
        ) : (
          <>
            <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-green-500/20 animate-in zoom-in duration-500">
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-green-400 font-bold">₹{amount}</span>
              </div>
            </div>

            {activationComplete ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
                <p className="text-green-200 text-sm">
                  ✓ Verified! You can now start creating project reels.
                </p>
              </div>
            ) : (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-6">
                <p className="text-orange-200 text-sm">
                  Manual verification pending. Your quota will update shortly.
                </p>
              </div>
            )}

            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-6 text-lg font-bold hover:scale-[1.02] transition-transform"
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
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
