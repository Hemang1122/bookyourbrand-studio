
'use client';

import { useEffect, useState } from 'react';

export function WelcomeHeader({ name }: { name: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="mb-6 overflow-hidden">
      <h2
        className={`text-3xl md:text-4xl font-bold tracking-tight transition-all duration-1000 ease-out ${
          isMounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Welcome, {capitalizedName}!
        </span>
      </h2>
      <p
        className={`text-muted-foreground mt-2 transition-all duration-1000 ease-out delay-200 ${
          isMounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}
      >
        Here's what's happening in your workspace today.
      </p>
    </div>
  );
}
