import { Award, Medal, Trophy, Wand2, Mic } from 'lucide-react';

export const packages = [
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
