
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import type { User } from '@/lib/types';
import { SupportChatList } from './components/SupportChatList';
import SupportChatRoom from './components/SupportChatRoom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  }, [currentUser, potentialChatPartners, selectedChatPartner]);
  
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="h-[calc(100vh-8rem)] bg-[#0F0F1A] rounded-lg overflow-hidden">
      <div className={cn("h-full w-full flex transition-transform duration-300 ease-in-out", {
        'md:transform-none': true,
        'transform -translate-x-full': selectedChatPartner && !isAdmin,
      })}>
        <div className="w-full md:w-auto shrink-0">
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
              <div className="hidden md:flex flex-col items-center justify-center h-full text-white/50 relative overflow-hidden">
                 <div className="absolute inset-0 z-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-gradient-to-br from-primary/10 to-accent/10"
                      style={{
                        width: `${Math.random() * 80 + 40}px`,
                        height: `${Math.random() * 80 + 40}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <div 
                  className="relative flex items-center justify-center h-24 w-24 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(124,58,237,0) 60%)'
                  }}
                >
                  <MessageSquare 
                    className="h-12 w-12" 
                    style={{
                      '--gradient-start': '#7C3AED',
                      '--gradient-end': '#EC4899',
                      filter: 'url(#gradient-filter)'
                    } as React.CSSProperties}
                  />
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <filter id="gradient-filter">
                        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                      </filter>
                      <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--gradient-start)" />
                        <stop offset="100%" stopColor="var(--gradient-end)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mt-6">Select a conversation</h2>
                <p className="text-white/60 mt-1">Choose from your conversations on the left to start messaging</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
