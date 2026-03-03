'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Client } from '@/lib/types';
import { Trash2, Building2, Package } from 'lucide-react';
import { useData } from '../../data-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DocumentManager } from './document-manager';
import { Badge } from '@/components/ui/badge';


type ViewClientDetailsDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ViewClientDetailsDialog({ client, children }: ViewClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { deleteUser } = useData();

  const handleDeleteConfirmed = async () => {
    await deleteUser(client.id);
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Client Details: {client.name}</DialogTitle>
          <DialogDescription>Viewing details for {client.company}.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Account Details</h4>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium text-white">{client.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-white">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium text-white">{client.company || 'Not Specified'}</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Active Package</h4>
                  </div>
                  {client.currentPackage ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Plan</p>
                        <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">
                          {client.currentPackage.packageName}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Usage</p>
                          <p className="text-sm font-bold text-white">{client.currentPackage.reelsUsed} / {client.currentPackage.numberOfReels} Reels</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-medium text-white">{client.currentPackage.duration}s per reel</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <p className="text-sm text-muted-foreground italic">No active package assigned</p>
                    </div>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Client Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {client.name}'s account and all associated data from authentication and Firestore. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </TabsContent>

          <TabsContent value="documents" className="py-4">
            <DocumentManager client={client} />
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
