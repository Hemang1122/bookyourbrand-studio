'use client';

import { useMemo } from 'react';
import { useData } from '../../data-provider';
import type { Client, Project, PackageName } from '@/lib/types';
import { packages as subscriptionPackages } from '../../settings/billing/packages-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


const getPackagePrice = (packageName: PackageName | undefined): number => {
    if (!packageName) return 0;
    const pkg = subscriptionPackages.find(p => p.name === packageName);
    const tier = pkg?.tiers?.[0];
    if (!tier || !tier.price) return 0;
    return parseInt(tier.price.replace(/,/g, ''), 10);
};

export function ClientAnalytics({ dateRange }: { dateRange: number }) {
  const { clients, projects } = useData();

  const analyticsData = useMemo(() => {
    const safeClients = clients || [];
    const safeProjects = projects || [];

    return safeClients.map(client => {
      const clientProjects = safeProjects.filter(p => p?.client?.id === client.id);
      const revenue = getPackagePrice(client.packageName) * clientProjects.length;

      return {
        ...client,
        projectsCreated: clientProjects.length,
        totalRevenue: `₹${revenue.toLocaleString('en-IN')}`,
      };
    }).sort((a, b) => b.projectsCreated - a.projectsCreated);
  }, [clients, projects, dateRange]);


  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-xl font-bold text-white">Client Leaderboard</h2>
                <p className="text-sm text-muted-foreground">Ranking clients by project volume and revenue.</p>
            </div>
        </div>
        {analyticsData.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
                No client data available.
            </div>
        )}
        {analyticsData.map((client, index) => (
            <div key={client.id}
                className={cn(
                    "rounded-2xl p-4 flex items-center gap-4",
                    "border transition-all",
                    "hover:border-purple-500/30",
                    index < 3 
                    ? "bg-gradient-to-r from-purple-900/20 to-pink-900/10 border-purple-500/20"
                    : "bg-[#13131F] border-white/5"
                )}>
            
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
              index < 3 ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-muted-foreground"
            )}>
                {index < 3 ? ['🥇','🥈','🥉'][index] : `#${index + 1}`}
            </div>
            
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200 font-bold">
                {client.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.company}</p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                <p className="text-lg font-bold text-white">{client.projectsCreated}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center min-w-[80px]">
                <p className="text-lg font-bold text-green-400">{client.totalRevenue}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
            </div>
            </div>
        ))}
    </div>
  );
}
