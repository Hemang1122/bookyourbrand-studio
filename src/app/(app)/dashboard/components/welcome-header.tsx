
'use client';

export function WelcomeHeader({ name }: { name: string }) {
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="mb-6">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Welcome, {capitalizedName}!
      </h2>
      <p className="text-muted-foreground mt-2">
        Here's what's happening in your workspace today.
      </p>
    </div>
  );
}
