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
import { ArrowUpCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PackageCard = ({ pkg }: { pkg: any }) => (
    <Card className="flex flex-col bg-[#13131F] border-white/5 overflow-hidden">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-white/5", pkg.color)}>
                    <pkg.icon className="w-8 h-8" />
                </div>
                <div>
                    <CardTitle className="text-white">{pkg.name}</CardTitle>
                    {pkg.description && <CardDescription className="text-gray-400">{pkg.description}</CardDescription>}
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            {pkg.tiers ? (
                 <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <div>Reels</div>
                        <div>Duration</div>
                        <div className="text-right">Price</div>
                    </div>
                    <div className="space-y-3">
                        {pkg.tiers.map((tier: any, index: number) => (
                             <div key={index} className="grid grid-cols-3 gap-4 items-center p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                                <div className="font-semibold text-white">{tier.reels}</div>
                                <div className="text-sm text-gray-400">{tier.duration}</div>
                                <div className="text-right font-bold text-primary">₹{tier.price}/-</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <div>Service Details</div>
                        <div className="text-right">Price</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="text-sm">
                            <ul className="space-y-2">
                                {pkg.features.map((feature: string, index: number) => (
                                    <li key={index} className="text-gray-400 flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-right font-bold text-primary text-xl">₹{pkg.price}/-</div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
);

function ClientSubscriptionCard() {
    const { user } = useAuth();
    const { clients, projects, isLoading } = useData();
    const router = useRouter();

    const myClientRecord = useMemo(() => {
        if (!user || !clients) return null;
        return clients.find(c => c.id === user.id);
    }, [user, clients]);

    if (isLoading) {
        return <Card className="h-48 animate-pulse bg-muted/50" />;
    }

    if (!myClientRecord) return null;

    const reelsUsed = myClientRecord.currentPackage?.reelsUsed || 0;
    const reelsLimit = myClientRecord.reelsLimit || 0;
    const usagePercentage = reelsLimit > 0 ? (reelsUsed / reelsLimit) * 100 : 0;

    return (
        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-32 w-32 text-white" />
            </div>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white text-2xl">My Subscription</CardTitle>
                        <CardDescription className="text-purple-300">Active content editing plan</CardDescription>
                    </div>
                    <Badge className="bg-primary hover:bg-primary/90 text-white border-0">
                        {myClientRecord.currentPackage?.status || 'Active'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
                <div className='bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4'>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Current Plan</p>
                            <p className="font-bold text-3xl text-white">{myClientRecord.packageName || 'Bronze'} Plan</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm font-medium mb-1">Reels Used</p>
                            <p className="font-mono text-2xl text-white">
                                {reelsUsed} <span className="text-gray-500 text-sm">/ {reelsLimit}</span>
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Progress value={usagePercentage} className="h-2 bg-white/5" />
                        <p className="text-xs text-muted-foreground text-right">{Math.round(usagePercentage)}% of quota consumed</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => router.push('/packages')} className="flex-1 bg-white text-black hover:bg-white/90">
                        Explore All Packages
                    </Button>
                    <UpgradeDialog client={myClientRecord}>
                        <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5">
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                            Upgrade Plan
                        </Button>
                    </UpgradeDialog>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto py-10 max-w-6xl space-y-12">
            {user?.role === 'client' && (
                <ClientSubscriptionCard />
            )}

             <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-white">Agency Packages</h2>
                <p className="text-muted-foreground text-lg">Premium video editing solutions tailored for your brand.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {packages.map(pkg => (
                    <PackageCard key={pkg.name} pkg={pkg} />
                ))}
            </div>

            <Card className="bg-primary/5 border-primary/20 text-center p-8">
                <CardHeader>
                    <CardTitle className="text-white">Need a Custom Solution?</CardTitle>
                    <CardDescription className="text-gray-400">If our standard packages don't fit your needs, we can create a custom one for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-300">Contact our account management team directly for bespoke pricing.</p>
                    <div className="flex flex-col items-center gap-2">
                        <p className="font-bold text-2xl text-primary">+91 84339 43520</p>
                        <p className="text-sm text-gray-500">Available Mon-Sat, 10 AM - 7 PM IST</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
