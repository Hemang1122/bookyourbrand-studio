'use client';

import { FileVideo2 } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

export function Logo({ className }: { className?: string }) {
  const { open } = useSidebar();
  return (
    <div className={`flex items-center gap-2 text-primary ${className}`}>
      <FileVideo2 className="h-6 w-6" />
      {open && <h1 className="text-xl font-bold">BookYourBrands</h1>}
    </div>
  );
}
