import { doc, updateDoc, increment, getDoc, Firestore } from 'firebase/firestore';

export async function incrementPackageUsage(
  firestore: Firestore, 
  clientId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const clientRef = doc(firestore, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) {
      return { success: false, message: 'Client not found' };
    }

    const clientData = clientSnap.data();
    const currentPackage = clientData.currentPackage;

    if (!currentPackage) {
      return { success: false, message: 'No active package found' };
    }

    if (currentPackage.status !== 'active') {
      return { success: false, message: 'Package is not active' };
    }

    // Check if package has expired
    if (currentPackage.expiryDate && new Date(currentPackage.expiryDate.toDate ? currentPackage.expiryDate.toDate() : currentPackage.expiryDate) < new Date()) {
      await updateDoc(clientRef, {
        'currentPackage.status': 'expired'
      });
      return { success: false, message: 'Package has expired' };
    }

    // Check if reels limit reached
    if (currentPackage.reelsUsed >= currentPackage.numberOfReels) {
      return { success: false, message: 'Package reel limit reached' };
    }

    // Increment reels used
    await updateDoc(clientRef, {
      'currentPackage.reelsUsed': increment(1)
    });

    // Also update user document
    const userRef = doc(firestore, 'users', clientId);
    await updateDoc(userRef, {
      'currentPackage.reelsUsed': increment(1)
    });

    return { 
      success: true, 
      message: `Reel used: ${currentPackage.reelsUsed + 1}/${currentPackage.numberOfReels}` 
    };
  } catch (error: any) {
    console.error('Error incrementing package usage:', error);
    return { success: false, message: error.message };
  }
}

export async function checkPackageLimit(
  firestore: Firestore, 
  clientId: string
): Promise<{ canCreate: boolean; message: string }> {
  try {
    const clientRef = doc(firestore, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) {
      return { canCreate: false, message: 'Client not found' };
    }

    const clientData = clientSnap.data();
    const currentPackage = clientData.currentPackage;

    if (!currentPackage) {
      return { canCreate: false, message: 'No active package. Please select a package first.' };
    }

    if (currentPackage.status !== 'active') {
      return { canCreate: false, message: 'Package is not active' };
    }

    if (currentPackage.expiryDate && new Date(currentPackage.expiryDate.toDate ? currentPackage.expiryDate.toDate() : currentPackage.expiryDate) < new Date()) {
      return { canCreate: false, message: 'Package has expired' };
    }

    if (currentPackage.reelsUsed >= currentPackage.numberOfReels) {
      return { 
        canCreate: false, 
        message: `Package limit reached (${currentPackage.reelsUsed}/${currentPackage.numberOfReels}). Please upgrade your package.` 
      };
    }

    return { 
      canCreate: true, 
      message: `${currentPackage.numberOfReels - currentPackage.reelsUsed} reels remaining` 
    };
  } catch (error: any) {
    console.error('Error checking package limit:', error);
    return { canCreate: false, message: error.message };
  }
}
