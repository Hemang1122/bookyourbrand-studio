
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '../../data-provider';
import type { Client, Project, PackageName } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { packages as subscriptionPackages } from '../../settings/billing/packages-data';

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
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.client.id === client.id);
      
      const revenue = getPackagePrice(client.packageName) * clientProjects.length;

      return {
        ...client,
        projectCount: clientProjects.length,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue || b.projectCount - a.projectCount);
  }, [clients, projects, dateRange]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Activity & Revenue</CardTitle>
        <CardDescription>Overview of client projects and generated revenue.</CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Projects Created</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyticsData.map(client => (
              <TableRow key={client.id}>
                <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.company}</div>
                </TableCell>
                <TableCell className="text-right font-semibold text-lg">{client.projectCount}</TableCell>
                <TableCell className="text-right font-mono text-lg">
                  ₹{client.revenue.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            ))}
             {analyticsData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No client data available.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
