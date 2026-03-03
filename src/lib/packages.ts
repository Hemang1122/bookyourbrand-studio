import { Package } from './types';

export const PREDEFINED_PACKAGES: Package[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    reelOptions: [10, 15, 30],
    durationOptions: [30],
    prices: {
      10: { 30: 2500 },
      15: { 30: 3450 },
      30: { 30: 6300 }
    },
    features: ['Up to 30 seconds', 'Basic editing', '48-72 hour delivery']
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '⭐',
    reelOptions: [10, 15, 30],
    durationOptions: [45],
    prices: {
      10: { 45: 4000 },
      15: { 45: 5700 },
      30: { 45: 10800 }
    },
    features: ['Up to 45 seconds', 'Standard editing', '48-72 hour delivery']
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '🥇',
    reelOptions: [10, 15, 30],
    durationOptions: [60],
    prices: {
      10: { 60: 5000 },
      15: { 60: 7200 },
      30: { 60: 13800 }
    },
    features: ['Up to 60 seconds', 'Premium editing', '48-72 hour delivery']
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: '💎',
    reelOptions: [10, 15, 30],
    durationOptions: [90],
    prices: {
      10: { 90: 7500 },
      15: { 90: 10950 },
      30: { 90: 21300 }
    },
    features: ['Up to 90 seconds', 'Premium editing', 'Priority delivery']
  },
  {
    id: 'advanced',
    name: 'Advanced Editing',
    icon: '🎬',
    reelOptions: [10, 15, 30],
    durationOptions: [60],
    prices: {
      10: { 60: 15000 },
      15: { 60: 22200 },
      30: { 60: 43800 }
    },
    features: ['Motion graphics', 'After effects', '60 seconds duration', 'Priority delivery']
  }
];

export const ADDITIONAL_CHARGES = {
  aiVoiceOver: 200,
  stockFootage: 200
};
