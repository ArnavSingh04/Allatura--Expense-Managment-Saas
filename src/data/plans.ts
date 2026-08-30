// Tiers and features mirror the backend source of truth:
// plutus-be/src/billing/plans.config.ts (free / pro / enterprise).
// The tier value is sent to POST /v1/billing/checkout; the actual price and
// currency are defined by the Stripe Price the backend resolves for that tier.
export type PlanTier = 'free' | 'pro' | 'enterprise';

export type PlanCardData = {
  tier: PlanTier;
  title: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  priceColor: string;
  btnColor: string;
  buttonDisabled: boolean;
  buttonText: string;
};

export const PLANS: PlanCardData[] = [
  {
    tier: 'free',
    title: 'Free',
    price: '$0',
    duration: '',
    description: 'Core workflows with starter limits.',
    features: [
      'Up to 2 projects, 3 users',
      'Dashboard, projects, and contracts',
      'Portfolio overview & calendars',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Get started',
  },
  {
    tier: 'pro',
    title: 'Pro',
    price: '$49',
    duration: '/ month',
    description: 'For teams scaling portfolio delivery.',
    features: [
      'Unlimited projects, up to 15 users',
      'Variations & department expenses',
      'Advanced analytics',
      '14-day free trial',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Upgrade to Pro',
  },
  {
    tier: 'enterprise',
    title: 'Enterprise',
    price: '$199',
    duration: '/ month',
    description: 'Unlimited scale with governance and support.',
    features: [
      'Unlimited projects and users',
      'Everything in Pro',
      'Audit log & priority support',
      '14-day free trial',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Upgrade to Enterprise',
  },
];
