// Subscription Configuration for PathGen
// This file contains all pricing, product IDs, and subscription management logic

export interface SubscriptionProduct {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  priceFormatted: string;
  stripePriceId: string;
  available: boolean;
  category: 'base' | 'addon';
}

// Base Plan Configuration
export const BASE_PLAN: SubscriptionProduct = {
  id: 'pathgen-pro',
  name: 'PathGen Pro',
  description: '200 messages/month, saved chat history, better AI responses',
  price: 699,
  priceFormatted: '$6.99',
  stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_1SaQtBCitWuvPenEOZtoyh3x',
  available: true,
  category: 'base',
};

// Add-on Configuration
export const ADDONS: SubscriptionProduct[] = [
  {
    id: 'voice-interaction',
    name: 'Voice Interaction',
    description: '550 interactions/month, 60 minutes total, real-time coaching',
    price: 199,
    priceFormatted: '$1.99',
    stripePriceId: process.env.STRIPE_PRICE_VOICE || 'price_1SaQtBCitWuvPenEUDTb42el',
    available: false, // Temporarily unavailable
    category: 'addon',
  },
  {
    id: 'gameplay-analysis',
    name: 'Gameplay Analysis',
    description: '15 replays/month, heatmaps & mistake detection',
    price: 150,
    priceFormatted: '$1.50',
    stripePriceId: process.env.STRIPE_PRICE_GAMEPLAY || 'price_1SaQtBCitWuvPenEi5A7BpqI',
    available: false, // Temporarily unavailable
    category: 'addon',
  },
  {
    id: 'competitive-insights',
    name: 'Competitive Insights',
    description: 'Unlimited FNCS reports, ranked meta, loadout analysis',
    price: 75,
    priceFormatted: '$0.75',
    stripePriceId: process.env.STRIPE_PRICE_COMPETITIVE || 'price_1SaQtBCitWuvPenE8dVwR5O6',
    available: false, // Temporarily unavailable
    category: 'addon',
  },
  {
    id: 'heatmaps-stats',
    name: 'Heatmaps + Stats',
    description: 'Advanced analytics and performance tracking',
    price: 299,
    priceFormatted: '$2.99',
    stripePriceId: '', // Not yet available
    available: false,
    category: 'addon',
  },
  {
    id: 'team-coaching',
    name: 'Team Coaching Mode',
    description: 'Multi-player analysis and team strategy',
    price: 499,
    priceFormatted: '$4.99',
    stripePriceId: '', // Not yet available
    available: false,
    category: 'addon',
  },
  {
    id: 'custom-playstyle',
    name: 'Custom Playstyle Model',
    description: 'AI trained on your specific playstyle',
    price: 799,
    priceFormatted: '$7.99',
    stripePriceId: '', // Not yet available
    available: false,
    category: 'addon',
  },
];

// Calculate total price
export function calculateTotal(basePlan: boolean, selectedAddons: string[]): number {
  let total = 0;
  if (basePlan) total += BASE_PLAN.price;
  
  selectedAddons.forEach(addonId => {
    const addon = ADDONS.find(a => a.id === addonId);
    if (addon && addon.available) {
      total += addon.price;
    }
  });
  
  return total;
}

// Format price for display
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Get addon by ID
export function getAddonById(id: string): SubscriptionProduct | undefined {
  return ADDONS.find(a => a.id === id);
}

// Get available addons
export function getAvailableAddons(): SubscriptionProduct[] {
  return ADDONS.filter(a => a.available);
}

// Map addon name to ID (for backwards compatibility with existing code)
export function mapAddonNameToId(name: string): string {
  const mapping: { [key: string]: string } = {
    'Voice Interaction': 'voice-interaction',
    'Gameplay Analysis': 'gameplay-analysis',
    'Competitive Insights': 'competitive-insights',
    'Heatmaps + Stats': 'heatmaps-stats',
    'Team Coaching Mode': 'team-coaching',
    'Custom Playstyle Model': 'custom-playstyle',
  };
  return mapping[name] || name.toLowerCase().replace(/\s+/g, '-');
}

// Map addon ID to name
export function mapAddonIdToName(id: string): string {
  const addon = getAddonById(id);
  return addon ? addon.name : id;
}

