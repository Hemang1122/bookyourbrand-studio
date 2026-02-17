
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useMemo } from 'react';
import { packages } from './packages-data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase/provider';
import { useData } from '../../data-provider';
import { UpgradeDialog } from './components/upgrade-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowUpCircle } from 'lucide-react';

const PackageCard = ({ pkg }: { pkg: any }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-4">
                <pkg.icon className={cn('w-10 h-10', pkg.color)} />
                <div>
                    <CardTitle>{pkg.name}</CardTitle>
                    {pkg.description && <CardDescription>{pkg.description}</CardDescription>}
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            {pkg.tiers ? (
                 <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-muted-foreground">
                        <div>Number of Reels</div>
                        <div>Duration</div>
                        <div className="text-right">Price</div>
                    </div>
                    <div className="space-y-2">
                        {pkg.tiers.map((tier: any, index: number) => (
                             <div key={index} className="grid grid-cols-3 gap-4 items-center">
                                <div className="font-semibold">{tier.reels}</div>
                                <div>{tier.duration}</div>
                                <div className="text-right font-bold text-lg">₹{tier.price}/-</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-muted-foreground">
                        <div>Service</div>
                        <div className="text-right">Price</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="text-sm">
                            <ul className="list-disc list-inside space-y-1">
                                {pkg.features.map((feature: string, index: number) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-right font-bold text-lg">₹{pkg.price}/-</div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
);

function ClientSubscriptionCard() {
    const { user } = useAuth();
    const { clients, projects, isLoading } = useData();

    const myClientRecord = useMemo(() => {
        if (!user || !clients) return null;
        return clients.find(c => c.id === user.id);
    }, [user, clients]);

    if (isLoading || !myClientRecord) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Subscription</CardTitle>
                    <CardDescription>View your current plan and usage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
                </CardContent>
            </Card>
        )
    }

    const activeProjects = (projects || []).filter(p => p.client.id === myClientRecord?.id && p.status !== 'Completed' && p.status !== 'Approved');
    const reelsUsed = activeProjects.length;
    const reelsLimit = myClientRecord.reelsLimit || 0;
    const usagePercentage = reelsLimit > 0 ? (reelsUsed / reelsLimit) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Subscription</CardTitle>
                <CardDescription>View and manage your current plan and usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='space-y-2'>
                    <div className="flex justify-between items-baseline">
                        <p className="font-bold text-xl">{myClientRecord.packageName} Plan</p>
                        <p className="text-muted-foreground text-sm">
                            {reelsUsed} of {reelsLimit === 9999 ? 'Unlimited' : reelsLimit} projects used
                        </p>
                    </div>
                    <Progress value={usagePercentage} />
                </div>

                <UpgradeDialog client={myClientRecord}>
                    <Button className="w-full">
                        <ArrowUpCircle className="mr-2" />
                        Upgrade or Change Plan
                    </Button>
                </UpgradeDialog>
            </CardContent>
        </Card>
    );
}

export default function BillingPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            {user?.role === 'client' && (
                <ClientSubscriptionCard />
            )}

             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Our Packages</h2>
                <p className="text-muted-foreground">Find the perfect plan for your brand.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {packages.map(pkg => (
                    <PackageCard key={pkg.name} pkg={pkg} />
                ))}
            </div>

            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Please Note</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Reels will be delivered within 48-72 working hours.</p>
                    <p className="font-bold text-lg mt-4">+91 84339 43520</p>
                </CardContent>
            </Card>
        </div>
    )
}
