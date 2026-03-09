import { Award, Medal, Trophy, Wand2, Mic, Diamond } from 'lucide-react';

export const packages = [
    {
        name: 'Bronze',
        icon: Award,
        color: 'text-amber-700',
        tiers: [
            { reels: 10, duration: 'Up to 30 seconds', price: '3,000' },
            { reels: 15, duration: 'Up to 30 seconds', price: '4,200' },
            { reels: 30, duration: 'Up to 30 seconds', price: '7,800' },
        ],
    },
    {
        name: 'Silver',
        icon: Medal,
        color: 'text-slate-400',
        tiers: [
            { reels: 10, duration: 'Up to 45 seconds', price: '4,000' },
            { reels: 15, duration: 'Up to 45 seconds', price: '5,700' },
            { reels: 30, duration: 'Up to 45 seconds', price: '10,800' },
        ],
    },
    {
        name: 'Gold',
        icon: Trophy,
        color: 'text-amber-500',
        tiers: [
            { reels: 10, duration: 'Up to 60 seconds', price: '5,000' },
            { reels: 15, duration: 'Up to 60 seconds', price: '7,200' },
            { reels: 30, duration: 'Up to 60 seconds', price: '13,800' },
        ],
    },
    {
        name: 'Diamond',
        icon: Diamond,
        color: 'text-blue-400',
        tiers: [
            { reels: 10, duration: 'Up to 90 seconds', price: '7,500' },
            { reels: 15, duration: 'Up to 90 seconds', price: '10,950' },
            { reels: 30, duration: 'Up to 90 seconds', price: '21,300' },
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
