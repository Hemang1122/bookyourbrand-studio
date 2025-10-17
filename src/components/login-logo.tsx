'use client';

import { FileVideo2 } from 'lucide-react';

export function LoginLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-primary ${className}`}>
      <FileVideo2 className="h-6 w-6" />
      <h1 className="text-xl font-bold">BookYourBrands</h1>
    </div>
  );
}
