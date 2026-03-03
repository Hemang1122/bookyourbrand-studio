import { Firestore, collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Client, PackageName } from './types';

/**
 * Determines the appropriate new package configuration based on the legacy billing system.
 * Based on:
 * - Bronze: 10/15/30 reels @ 30s -> ₹2,500 / ₹3,450 / ₹6,300
 * - Silver: 10/15/30 reels @ 60s -> ₹5,000 / ₹7,200 / ₹13,800
 * - Gold: 10/15/30 reels @ 90s -> ₹7,000 / ₹10,200 / ₹19,800
 * - Advanced Editing: 10/15/30 reels @ 60s -> ₹15,000 / ₹22,200 / ₹43,800
 */
const determinePackageFromOldBilling = (client: Client): {
  packageName: PackageName;
  reels: number;
  duration: number;
  price: number;
} => {
  const reelsLimit = client.reelsLimit || 0;
  const plan = (client as any).plan || client.packageName || '';
  const planLower = plan.toLowerCase();

  // Advanced Editing (highest tier)
  if (planLower.includes('advanced') || 
      planLower.includes('premium') ||
      reelsLimit >= 30) {
    return {
      packageName: 'Advanced Editing',
      reels: 30,
      duration: 60,
      price: 43800
    };
  }

  // Gold (90 seconds)
  if (planLower.includes('gold') || 
      planLower.includes('pro') ||
      reelsLimit >= 15) {
    return {
      packageName: 'Gold',
      reels: 30,
      duration: 60,
      price: 13800
    };
  }

  // Silver (60 seconds)
  if (planLower.includes('silver') || 
      planLower.includes('growth') ||
      reelsLimit >= 10) {
    return {
      packageName: 'Silver',
      reels: 15,
      duration: 45,
      price: 5700
    };
  }

  // Bronze (default/fallback)
  return {
    packageName: 'Bronze',
    reels: 10,
    duration: 30,
    price: 2500
  };
};

export async function migrateClientToNewPackageSystem(
  firestore: Firestore,
  client: Client,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Skip if already has new package
    if (client.currentPackage) {
      return { 
        success: true, 
        message: `${client.name} already has new package system` 
      };
    }

    // Determine package based on old billing system
    const packageConfig = determinePackageFromOldBilling(client);

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

    // Calculate reelsUsed from existing projects
    const projectsRef = collection(firestore, 'projects');
    const q = query(projectsRef, where('client.id', '==', client.id));
    const projectsSnap = await getDocs(q);
    const projectCount = projectsSnap.size;

    // Create new package entry
    const newPackage = {
      clientId: client.id,
      packageName: packageConfig.packageName,
      numberOfReels: packageConfig.reels,
      duration: packageConfig.duration,
      price: packageConfig.price,
      reelsUsed: Math.min(projectCount, packageConfig.reels), // Don't exceed initial limit
      startDate,
      expiryDate,
      status: 'active' as const,
      migratedFrom: {
        oldPlan: (client as any).plan || client.packageName || 'Unknown',
        oldReelsLimit: client.reelsLimit || 0,
        projectCount
      },
      createdBy: adminId,
      createdAt: serverTimestamp()
    };

    // Add to client-packages collection
    await addDoc(collection(firestore, 'client-packages'), newPackage);

    // Update client document
    const clientRef = doc(firestore, 'clients', client.id);
    await updateDoc(clientRef, {
      currentPackage: newPackage,
      reelsLimit: packageConfig.reels,
      packageName: packageConfig.packageName,
      reelsCreated: projectCount,
      // Keep old data for reference but mark as migrated
      oldBillingSystem: {
        plan: (client as any).plan || null,
        reelsLimit: client.reelsLimit || null,
        migratedAt: serverTimestamp()
      }
    });

    // Update user document
    const userRef = doc(firestore, 'users', client.id);
    await updateDoc(userRef, {
      packageName: packageConfig.packageName,
      reelsLimit: packageConfig.reels
    });

    return {
      success: true,
      message: `Migrated ${client.name} to ${packageConfig.packageName} (${projectCount} projects found)`
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: `Failed to migrate ${client.name}: ${error.message}`
    };
  }
}

export async function migrateAllClients(
  firestore: Firestore,
  adminId: string,
  onProgress?: (current: number, total: number, clientName: string) => void
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  details: string[];
}> {
  const results = {
    total: 0,
    succeeded: 0,
    failed: 0,
    details: [] as string[]
  };

  try {
    // Get all clients
    const clientsRef = collection(firestore, 'clients');
    const clientsSnap = await getDocs(clientsRef);
    const clients = clientsSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Client));

    results.total = clients.length;

    // Migrate each client sequentially to avoid overwhelming Firestore or losing track
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      
      if (onProgress) {
        onProgress(i + 1, clients.length, client.name);
      }

      const result = await migrateClientToNewPackageSystem(
        firestore,
        client,
        adminId
      );

      if (result.success) {
        results.succeeded++;
        results.details.push(`✅ ${result.message}`);
      } else {
        results.failed++;
        results.details.push(`❌ ${result.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error('Migration orchestration error:', error);
    throw error;
  }
}
