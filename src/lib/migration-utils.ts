import { Firestore, collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Client, PackageName } from './types';

// Mapping old plans to new packages
const PLAN_TO_PACKAGE_MAP: Record<string, {
  packageName: PackageName;
  reels: number;
  duration: number;
  price: number;
}> = {
  'Starter Plan': {
    packageName: 'Bronze',
    reels: 10,
    duration: 30,
    price: 2500
  },
  'Growth Plan': {
    packageName: 'Silver',
    reels: 15,
    duration: 45,
    price: 5700
  },
  'Pro Plan': {
    packageName: 'Gold',
    reels: 30,
    duration: 60,
    price: 13800
  },
  'Enterprise Plan': {
    packageName: 'Diamond',
    reels: 30,
    duration: 90,
    price: 21300
  }
};

// Fallback: if we don't know the plan name, use reelsLimit
const REEL_LIMIT_TO_PACKAGE: Record<number, {
  packageName: PackageName;
  reels: number;
  duration: number;
  price: number;
}> = {
  3: {
    packageName: 'Bronze',
    reels: 10,
    duration: 30,
    price: 2500
  },
  5: {
    packageName: 'Silver',
    reels: 15,
    duration: 45,
    price: 4000
  },
  10: {
    packageName: 'Gold',
    reels: 30,
    duration: 60,
    price: 13800
  },
  15: {
    packageName: 'Silver',
    reels: 15,
    duration: 45,
    price: 5700
  },
  30: {
    packageName: 'Gold',
    reels: 30,
    duration: 60,
    price: 13800
  }
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

    // Determine package based on old system
    let packageConfig;
    
    // Try to match by plan name first
    // Note: client might have 'packageName' string in old system as well
    const oldPlanName = (client as any).plan || client.packageName;

    if (oldPlanName && PLAN_TO_PACKAGE_MAP[oldPlanName]) {
      packageConfig = PLAN_TO_PACKAGE_MAP[oldPlanName];
    } 
    // Fallback to reelsLimit
    else if (client.reelsLimit && REEL_LIMIT_TO_PACKAGE[client.reelsLimit]) {
      packageConfig = REEL_LIMIT_TO_PACKAGE[client.reelsLimit];
    }
    // Default to Bronze if nothing matches
    else {
      packageConfig = {
        packageName: 'Bronze' as PackageName,
        reels: 10,
        duration: 30,
        price: 2500
      };
    }

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
        oldPlan: oldPlanName || 'Unknown',
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
        plan: oldPlanName || null,
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
