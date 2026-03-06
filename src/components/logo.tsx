'use client';

import { useSidebar } from './ui/sidebar';

export function Logo({ className }: { className?: string }) {
  const { open } = useSidebar();
  return (
    <div className={`flex items-center justify-center w-full px-4 ${className}`}>
      {open && <h1 className="text-xl font-bold text-primary whitespace-nowrap">BookYourBrands</h1>}
    </div>
  );
}
