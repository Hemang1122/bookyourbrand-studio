'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import type { User, Chat } from '@/lib/types';
import { SupportChatList } from './components/SupportChatList';
import { MessageSquare, Loader2 } from 'lucide-react';
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
  const [selectedChat, setSelectedChat] = useState<{ user: User; chatId?: string } | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Load ALL chats for admin (support + direct)
  const { data: adminAllChats, isLoading: adminChatsLoading } = useCollection<Chat>(
    useMemoFirebase(() => {
      if (!firestore || !currentUser || currentUser.role !== 'admin') return null;
      return query(
        collection(firestore, 'chats'),
        orderBy('lastMessageAt', 'desc')
      );
    }, [firestore, currentUser])
  );

  const chats = currentUser?.role === 'admin' ? (adminAllChats || []) : clientChats;
  const isLoading = dataLoading || (currentUser?.role === 'admin' && adminChatsLoading);

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

  return (
    <div className="h-[calc(100vh-8rem)] bg-[#0F0F1A] rounded-lg overflow-hidden border border-white/5 shadow-2xl">
      <div className="h-full w-full flex">
        {isAdmin && (
          <div className="w-full md:w-[340px] shrink-0 border-r border-white/5">
            <SupportChatList
              users={users}
              selectedChatId={selectedChat?.chatId}
              onSelectChat={(user, chatId) => setSelectedChat({ user, chatId })}
              chats={chats}
            />
          </div>
        )}

        <div className="w-full shrink-0 flex-1 md:block">
          {isAdmin ? (
            selectedChat ? (
              <SupportChatRoom
                key={selectedChat.chatId || selectedChat.user.id}
                chatPartner={selectedChat.user}
                chatId={selectedChat.chatId}
                onBack={() => setSelectedChat(null)}
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
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0) 70%)' }}
      >
        <MessageSquare className="h-12 w-12 text-primary/40" />
      </div>
      <h2 className="text-xl font-bold text-white mt-6">Select a conversation</h2>
      <p className="text-white/40 mt-1 text-sm">Choose from your threads on the left</p>
    </div>
  );
}