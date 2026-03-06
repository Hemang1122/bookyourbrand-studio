'use client';

import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordingIndicatorProps {
  isRecording: boolean;
  userName?: string;
}

export function RecordingIndicator({ isRecording, userName }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 animate-pulse mx-4 mb-2">
      <div className="relative flex items-center">
        <Mic className="h-4 w-4 text-red-500" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      </div>
      <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
        Recording Voice Note
      </span>
    </div>
  );
}
