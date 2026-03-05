'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import type { User } from '@/lib/types';
import { SupportChatList } from './components/SupportChatList';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Use dynamic import for SupportChatRoom because it uses browser-only APIs (WebRTC, MediaRecorder)
// and helps split the bundle to resolve ChunkLoadErrors in complex workstation environments.
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
  const { users } = useData();
  const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);

  const potentialChatPartners = useMemo(() => {
    if (!currentUser || !users) return [];
    if (currentUser.role === 'admin') {
      return users.filter(u => u.id !== currentUser.id);
    }
    return users.filter(u => u.role === 'admin');
  }, [currentUser, users]);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'client' || currentUser.role === 'team')) {
      if (potentialChatPartners.length > 0 && !selectedChatPartner) {
        setSelectedChatPartner(potentialChatPartners[0]);
      }
    }
  }, [potentialChatPartners, selectedChatPartner, currentUser]);
  
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="h-[calc(100vh-8rem)] bg-[#0F0F1A] rounded-lg overflow-hidden border border-white/5 shadow-2xl">
      <div className={cn("h-full w-full flex transition-transform duration-300 ease-in-out", {
        'md:transform-none': true,
        'transform -translate-x-full': selectedChatPartner && !isAdmin,
      })}>
        <div className="w-full md:w-[340px] shrink-0 border-r border-white/5">
          <SupportChatList
            contacts={potentialChatPartners}
            selectedContact={selectedChatPartner}
            onSelectContact={setSelectedChatPartner}
          />
        </div>

        <div className="w-full shrink-0 flex-1 md:block">
           {selectedChatPartner ? (
              <SupportChatRoom
                key={selectedChatPartner.id} // Re-mount component on partner change
                chatPartner={selectedChatPartner}
                onBack={() => setSelectedChatPartner(null)}
              />
            ) : (
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
                <p className="text-white/40 mt-1 text-sm">Choose from your conversations on the left to start messaging</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
