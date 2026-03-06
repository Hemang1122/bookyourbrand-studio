'use client';

import { BrandLogo } from './brand-logo';
import { useSidebar } from './ui/sidebar';

export function Logo({ className }: { className?: string }) {
  const { open } = useSidebar();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandLogo variant="icon" className="w-8 h-8 shrink-0" />
      {open && <h1 className="text-xl font-bold text-primary whitespace-nowrap">BookYourBrands</h1>}
    </div>
  );
}
