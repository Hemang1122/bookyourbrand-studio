
'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { useFirebaseServices } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package as PackageIcon, Users, TrendingUp, Edit, Trash2, Check, X } from 'lucide-react';
import { PREDEFINED_PACKAGES } from '@/lib/packages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminPackagesPage() {
  const { user } = useAuth();
  const { clients } = useData();
  const { firestore } = useFirebaseServices();
  const { toast } = useToast();
  
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [customPackage, setCustomPackage] = useState({
    packageName: '',
    numberOfReels: 1,
    duration: 30,
    price: 0,
    customDetails: '',
    expiryDays: 30
  });

  const clientsWithPackages = clients?.filter(c => c.currentPackage);
  const clientsWithoutPackages = clients?.filter(c => !c.currentPackage);

  const handleCreateCustomPackage = async () => {
    if (!firestore || !selectedClient) {
      toast({ title: 'Error', description: 'Please select a client', variant: 'destructive' });
      return;
    }

    if (!customPackage.packageName || customPackage.price <= 0) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + customPackage.expiryDays);

      const newPackage = {
        clientId: selectedClient,
        packageName: customPackage.packageName,
        numberOfReels: customPackage.numberOfReels,
        duration: customPackage.duration,
        price: customPackage.price,
        reelsUsed: 0,
        startDate,
        expiryDate,
        status: 'active',
        customDetails: customPackage.customDetails || '',
        createdBy: user?.id,
        createdAt: serverTimestamp()
      };

      // Add to client-packages collection
      await addDoc(collection(firestore, 'client-packages'), newPackage);

      // Update client document with current package
      const clientRef = doc(firestore, 'clients', selectedClient);
      await updateDoc(clientRef, { 
        currentPackage: newPackage,
        reelsLimit: customPackage.numberOfReels,
        packageName: customPackage.packageName,
        reelsCreated: 0
      });

      toast({ title: 'Success', description: 'Custom package created successfully!' });
      setIsCreatingCustom(false);
      setSelectedClient('');
      setCustomPackage({
        packageName: '',
        numberOfReels: 1,
        duration: 30,
        price: 0,
        customDetails: '',
        expiryDays: 30
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAssignPredefinedPackage = async (clientId: string, pkgId: string, reels: number, duration: number) => {
    if (!firestore) return;

    const pkg = PREDEFINED_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return;

    const price = pkg.prices[reels]?.[duration];
    if (!price) {
      toast({ title: 'Error', description: 'Invalid package configuration', variant: 'destructive' });
      return;
    }

    try {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const newPackage = {
        clientId,
        packageName: pkg.name,
        numberOfReels: reels,
        duration,
        price,
        reelsUsed: 0,
        startDate,
        expiryDate,
        status: 'active',
        createdBy: user?.id,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(firestore, 'client-packages'), newPackage);

      const clientRef = doc(firestore, 'clients', clientId);
      await updateDoc(clientRef, { 
        currentPackage: newPackage,
        reelsLimit: reels,
        packageName: pkg.name,
        reelsCreated: 0
      });

      toast({ title: 'Success', description: 'Package assigned successfully!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8">Only admins can access this page.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Package Management</h1>
          <p className="text-gray-400">Manage client packages and subscriptions</p>
        </div>
        <Dialog open={isCreatingCustom} onOpenChange={setIsCreatingCustom}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 border-0">
              <Plus className="h-4 w-4" />
              Create Custom Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#13131F] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Custom Package</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Client *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Package Name *</Label>
                  <Input
                    placeholder="e.g., Single Video Edit, Trial Package"
                    value={customPackage.packageName}
                    onChange={(e) => setCustomPackage({ ...customPackage, packageName: e.target.value })}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Reels *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customPackage.numberOfReels}
                      onChange={(e) => setCustomPackage({ ...customPackage, numberOfReels: parseInt(e.target.value) || 1 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds) *</Label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={customPackage.duration}
                      onChange={(e) => setCustomPackage({ ...customPackage, duration: parseInt(e.target.value) || 30 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={customPackage.price}
                      onChange={(e) => setCustomPackage({ ...customPackage, price: parseInt(e.target.value) || 0 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customPackage.expiryDays}
                      onChange={(e) => setCustomPackage({ ...customPackage, expiryDays: parseInt(e.target.value) || 30 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Details (optional)</Label>
                  <Textarea
                    placeholder="Special features, editing requirements, delivery timeline..."
                    value={customPackage.customDetails}
                    onChange={(e) => setCustomPackage({ ...customPackage, customDetails: e.target.value })}
                    rows={3}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateCustomPackage} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 border-0">
                    Create Package
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingCustom(false)} className="border-white/10 text-white hover:bg-white/5">
                    Cancel
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Clients</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-white">{clients?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Active Packages</span>
            <PackageIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">{clientsWithPackages?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Without Package</span>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-white">{clientsWithoutPackages?.length || 0}</p>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 bg-black/20 border border-white/5">
          <TabsTrigger value="active" className="data-[state=active]:bg-primary">Active Packages</TabsTrigger>
          <TabsTrigger value="unassigned" className="data-[state=active]:bg-primary">Clients Without Package</TabsTrigger>
          <TabsTrigger value="predefined" className="data-[state=active]:bg-primary">Predefined Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-[#13131F] border-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400">Client</TableHead>
                  <TableHead className="text-gray-400">Package</TableHead>
                  <TableHead className="text-gray-400">Reels</TableHead>
                  <TableHead className="text-gray-400">Duration</TableHead>
                  <TableHead className="text-gray-400">Price</TableHead>
                  <TableHead className="text-gray-400">Usage</TableHead>
                  <TableHead className="text-gray-400">Expiry</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithPackages?.map(client => (
                  <TableRow key={client.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">{client.name}</p>
                        <p className="text-xs text-gray-400">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{client.currentPackage?.packageName}</TableCell>
                    <TableCell className="text-white">{client.currentPackage?.numberOfReels}</TableCell>
                    <TableCell className="text-white">{client.currentPackage?.duration}s</TableCell>
                    <TableCell className="text-white">₹{client.currentPackage?.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ 
                              width: `${((client.currentPackage?.reelsUsed || 0) / (client.currentPackage?.numberOfReels || 1)) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {client.currentPackage?.reelsUsed}/{client.currentPackage?.numberOfReels}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {client.currentPackage?.expiryDate ? 
                        format(new Date(client.currentPackage.expiryDate), 'PP') : 
                        'No expiry'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.currentPackage?.status === 'active' ? 'default' : 'secondary'} className={cn(
                        client.currentPackage?.status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/20" : ""
                      )}>
                        {client.currentPackage?.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned">
          <Card className="p-6 bg-[#13131F] border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Clients Without Active Package</h3>
            <div className="space-y-3">
              {clientsWithoutPackages?.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 border border-white/5 bg-black/20 rounded-xl hover:border-purple-500/30 transition-colors">
                  <div>
                    <p className="font-semibold text-white">{client.name}</p>
                    <p className="text-sm text-gray-400">{client.email}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white">Assign Package</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-[#13131F] border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle>Assign Package to {client.name}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[500px] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                          {PREDEFINED_PACKAGES.map(pkg => (
                            <Card key={pkg.id} className="p-4 bg-black/20 border-white/10 hover:border-purple-500/30 transition-colors">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{pkg.icon}</span>
                                <h4 className="font-bold text-white">{pkg.name}</h4>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {pkg.reelOptions.map(reels => (
                                  pkg.durationOptions.map(duration => (
                                    <Button
                                      key={`${reels}-${duration}`}
                                      variant="outline"
                                      size="sm"
                                      className="h-auto py-2 flex flex-col items-center justify-center border-white/10 text-xs text-gray-300 hover:text-white"
                                      onClick={() => handleAssignPredefinedPackage(client.id, pkg.id, reels, duration)}
                                    >
                                      <span>{reels} reels @ {duration}s</span>
                                      <span className="font-bold text-white">₹{pkg.prices[reels][duration].toLocaleString()}</span>
                                    </Button>
                                  ))
                                ))}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
              {clientsWithoutPackages?.length === 0 && (
                <p className="text-center text-gray-500 py-8">All clients have an active package.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="predefined">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREDEFINED_PACKAGES.map(pkg => (
              <Card key={pkg.id} className="p-6 bg-[#13131F] border-white/5 hover:border-purple-500/30 transition-colors">
                <div className="text-4xl mb-3">{pkg.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <ul className="space-y-2 mb-4">
                  {pkg.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Base Pricing:</p>
                  {pkg.reelOptions.map(reels => (
                    <div key={reels} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{reels} reels:</span>
                      <span className="font-semibold text-white">
                        ₹{pkg.prices[reels][pkg.durationOptions[0]].toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
