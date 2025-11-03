'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Medal, Trophy, Wand2, Mic } from 'lucide-react';
import React from 'react';

const packages = [
    {
        name: 'Bronze',
        icon: Award,
        color: 'text-amber-700',
        tiers: [
            { reels: 10, duration: 'Up to 30 seconds', price: '2,500' },
            { reels: 15, duration: 'Up to 30 seconds', price: '3,450' },
            { reels: 30, duration: 'Up to 30 seconds', price: '6,300' },
        ],
    },
    {
        name: 'Silver',
        icon: Medal,
        color: 'text-slate-400',
        tiers: [
            { reels: 10, duration: 'Up to 60 seconds', price: '5,000' },
            { reels: 15, duration: 'Up to 60 seconds', price: '7,200' },
            { reels: 30, duration: 'Up to 60 seconds', price: '13,800' },
        ],
    },
    {
        name: 'Gold',
        icon: Trophy,
        color: 'text-amber-500',
        tiers: [
            { reels: 10, duration: 'Up to 90 seconds', price: '7,000' },
            { reels: 15, duration: 'Up to 90 seconds', price: '10,200' },
            { reels: 30, duration: 'Up to 90 seconds', price: '19,800' },
        ],
    },
    {
        name: 'Advanced Editing',
        icon: Wand2,
        description: '(motion graphic + after effects)',
        color: 'text-purple-500',
        tiers: [
            { reels: 10, duration: 'Up to 60 seconds', price: '15,000' },
            { reels: 15, duration: 'Up to 60 seconds', price: '22,200' },
            { reels: 30, duration: 'Up to 60 seconds', price: '43,800' },
        ],
    },
    {
        name: 'Podcast',
        icon: Mic,
        color: 'text-cyan-500',
        price: '6,000',
        duration: 'Up to 1 hour',
        features: [
            'Color correction',
            'Thumbnail design',
            'Zoom cuts & transitions',
            'Light background music',
            'Basic audio clean-up',
            'Removing pauses, filler words & noise'
        ]
    }
];

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

export default function BillingPage() {
    return (
        <div className="space-y-8">
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
