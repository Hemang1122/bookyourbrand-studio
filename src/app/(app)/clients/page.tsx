
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, Search, Mail, Eye, Trash2 } from 'lucide-react';
import { useData } from '../data-provider';
import { useAuth } from '@/firebase/provider';
import { useUserStatus } from '@/firebase';
import { redirect } from 'next/navigation';
import { AddUserDialog } from '../team/components/add-user-dialog';
import { ViewClientDetailsDialog } from './components/view-client-details-dialog';
import type { Client } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// A new component for each client card to use hooks properly
const ClientCard = ({ client, isAdmin, onDelete }: { client: Client; isAdmin: boolean; onDelete: (id: string) => void; }) => {
  const userStatus = useUserStatus(client.id);
  const avatarUrl = (client as any).photoURL || PlaceHolderImages.find(p => p.id === client.avatar)?.imageUrl;
  const reelsUsage = client.reelsCreated || 0;
  const reelsLimit = client.reelsLimit || 3;
  const progress = Math.min(100, reelsLimit > 0 ? (reelsUsage / reelsLimit) * 100 : 0);

  return (
      <div className="group rounded-2xl p-5 bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <Avatar className="h-12 w-12">
                          <AvatarImage src={avatarUrl} alt={client.name} />
                          <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">
                              {client.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      {userStatus?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#13131F] bg-green-400" />
                      )}
                  </div>
                  <div>
                      <h3 className="font-semibold text-white">{client.name}</h3>
                      <p className="text-xs text-muted-foreground">{client.company || client.email}</p>
                  </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  {client.packageName || 'Starter'}
              </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3 text-center bg-white/[0.03] border border-white/5">
                  <p className="text-xl font-bold text-white">{reelsUsage}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reels Created</p>
              </div>
              <div className="rounded-xl p-3 text-center bg-white/[0.03] border border-white/5">
                  <p className="text-xl font-bold text-white">{reelsLimit}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reel Limit</p>
              </div>
          </div>

          <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Reel Usage</span>
                  <span>{reelsUsage}/{reelsLimit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{client.email}</span>
          </div>

          <div className="flex gap-2 pt-4 border-t border-white/5">
              <ViewClientDetailsDialog client={client}>
                  <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white text-xs">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                  </Button>
              </ViewClientDetailsDialog>
              {isAdmin && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-red-500/20 hover:bg-red-500/10 text-red-400 px-3">
                              <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {client.name}'s account and all associated data. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(client.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              )}
          </div>
      </div>
  );
};


export default function ClientsPage() {
  const { user } = useAuth();
  const { clients, deleteUser, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  if (user?.role !== 'admin') {
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }
  
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  return (
    <div className="container mx-auto py-10">
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="relative z-10 flex items-center justify-between">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
                          <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-white">Clients</h1>
                  </div>
                  <p className="text-muted-foreground ml-14">{clients.length} clients · manage all accounts</p>
              </div>
              <AddUserDialog>
                 <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                  </Button>
              </AddUserDialog>
          </div>
      </div>
      
      <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search clients..."
              className="pl-10 rounded-full bg-white/5 border-white/10 text-white focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50 w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>

       {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-[#13131F]" />)}
        </div>
       ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} isAdmin={user.role === 'admin'} onDelete={deleteUser} />
            ))}
          </div>
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-purple-500/10 border border-purple-500/20">
              <Building2 className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No clients found</h3>
            <p className="text-gray-500 text-sm">Add your first client to get started.</p>
          </div>
        )}
    </div>
  );
}
