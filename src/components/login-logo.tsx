'use client';

export function LoginLogo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <h1 className="text-4xl font-black text-white tracking-tighter uppercase">BookYourBrands</h1>
    </div>
  );
}
