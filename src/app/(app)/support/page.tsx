'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import type { User, Chat } from '@/lib/types';
import { SupportChatList } from './components/SupportChatList';
import { MessageSquare, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useCollection, useMemoFirebase, useFirebaseServices } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const SupportChatRoom = dynamic(() => import('./components/SupportChatRoom'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0F0F1A] text-white/50">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium">Initializing secure chat...</p>
    </div>
  )
});

export default function SupportPage() {
  const { user: currentUser } = useAuth();
  const { firestore } = useFirebaseServices();
  const { users, chats: clientChats, getOrCreateChat, isLoading: dataLoading } = useData();
  const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // RESTRICTION: Only the admin named "Neha" can access the support inbox
  const isNeha = useMemo(() => {
    return currentUser?.role === 'admin' && currentUser?.name.toLowerCase().includes('neha');
  }, [currentUser]);

  // Local query for Admins - load support chats on demand
  const { data: adminSupportChats, isLoading: adminChatsLoading } = useCollection<Chat>(
    useMemoFirebase(() => {
      if (!firestore || !currentUser || currentUser.role !== 'admin') return null;
      
      // If admin is NOT Neha, don't return a query (they shouldn't see support chats)
      if (!isNeha) return null;

      return query(
        collection(firestore, 'chats'),
        where('type', '==', 'support'),
        orderBy('lastMessageAt', 'desc')
      );
    }, [firestore, currentUser, isNeha])
  );

  const chats = currentUser?.role === 'admin' ? (adminSupportChats || []) : clientChats;
  const isLoading = dataLoading || (currentUser?.role === 'admin' && adminChatsLoading);

  const supportContacts = useMemo(() => {
    if (!currentUser || !users || !chats) return [];
    if (currentUser.role === 'admin') {
      const clientsWithChats = chats
        .filter(c => c.type === 'support')
        .map(c => c.clientId);
      return users.filter(u => clientsWithChats.includes(u.id));
    }
    return [];
  }, [currentUser, users, chats]);

  useEffect(() => {
    if (!currentUser || isLoading) return;

    if (currentUser.role === 'client') {
      getOrCreateChat('', true).then(id => {
        if (id) setActiveChatId(id);
      });
    }
  }, [currentUser, isLoading, getOrCreateChat]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0F0F1A]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  // If admin but not Neha, show a restricted access message
  if (isAdmin && !isNeha) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Support Inbox Restricted</h2>
        <p className="text-gray-400 max-w-md">
          Client support inquiries are currently managed exclusively by Neha. 
          If you need access to this inbox, please contact your supervisor.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-[#0F0F1A] rounded-lg overflow-hidden border border-white/5 shadow-2xl">
      <div className={cn("h-full w-full flex transition-transform duration-300 ease-in-out", {
        'md:transform-none': true,
        'transform -translate-x-full': (selectedChatPartner || activeChatId) && !isAdmin,
      })}>
        {isAdmin && (
          <div className="w-full md:w-[340px] shrink-0 border-r border-white/5">
            <SupportChatList
              contacts={supportContacts}
              selectedContact={selectedChatPartner}
              onSelectContact={setSelectedChatPartner}
              chats={chats}
            />
          </div>
        )}

        <div className="w-full shrink-0 flex-1 md:block">
           {isAdmin ? (
             selectedChatPartner ? (
                <SupportChatRoom
                  key={selectedChatPartner.id}
                  chatPartner={selectedChatPartner}
                  onBack={() => setSelectedChatPartner(null)}
                />
              ) : (
                <EmptyState />
              )
           ) : (
             activeChatId ? (
                <SupportChatRoom
                  chatId={activeChatId}
                  onBack={() => {}} 
                />
             ) : (
               <div className="flex items-center justify-center h-full">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-white/50 relative overflow-hidden bg-[#0F0F1A]">
        <div className="absolute inset-0 z-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-3xl animate-float"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>
      <div 
        className="relative flex items-center justify-center h-24 w-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0) 70%)'
        }}
      >
        <MessageSquare className="h-12 w-12 text-primary/40" />
      </div>
      <h2 className="text-xl font-bold text-white mt-6">Select a conversation</h2>
      <p className="text-white/40 mt-1 text-sm">Choose from your client support threads on the left</p>
  </div>
  );
}
