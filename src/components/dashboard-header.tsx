import { BrandLogo } from './brand-logo';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  showLogo = false,
  className 
}: DashboardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-6 mb-8', className)}>
      {showLogo && (
        <BrandLogo variant="icon" className="w-16 h-16 flex-shrink-0" />
      )}
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
