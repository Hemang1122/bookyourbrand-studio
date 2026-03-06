'use client';

import { BrandLogo } from './brand-logo';

export function LoginLogo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <BrandLogo variant="full" priority className="w-48 h-48" />
      <h1 className="text-3xl font-bold text-white tracking-tight">BookYourBrands</h1>
    </div>
  );
}
