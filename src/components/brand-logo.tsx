import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ variant = 'full', className, priority = false }: BrandLogoProps) {
  const sizes = {
    full: { width: 300, height: 300 },
    compact: { width: 200, height: 200 },
    icon: { width: 60, height: 60 }
  };

  const size = sizes[variant];

  return (
    <div className={cn('relative', className)}>
      <Image
        src="/logo.png"
        alt="Book Your Brands - We Get You Noticed"
        width={size.width}
        height={size.height}
        priority={priority}
        className="object-contain"
        quality={100}
      />
    </div>
  );
}