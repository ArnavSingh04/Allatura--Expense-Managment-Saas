export type PlanTier = 'free' | 'go' | 'pro';

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
  /** Stripe price id for checkout when user is signed in (optional). */
  productID?: string;
};

export const PLANS: PlanCardData[] = [
  {
    tier: 'free',
    title: 'Free',
    price: 'A$0',
    duration: '',
    description: 'Core workflows with starter limits.',
    features: [
      'Dashboard, projects, and contracts',
      'Variations, claims, and documents',
      'Limited projects and contracts',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Get started',
  },
  {
    tier: 'go',
    title: 'Go',
    price: 'A$99',
    duration: '/ month',
    description: 'Full usage without freemium caps.',
    features: [
      'Everything in Free',
      'Unlimited projects',
      'Unlimited contracts',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Upgrade to Go',
  },
  {
    tier: 'pro',
    title: 'Pro',
    price: 'A$299',
    duration: '/ month',
    description: 'For teams scaling portfolio delivery.',
    features: [
      'Everything in Go',
      'Priority support',
      'Best for multi-project operations',
    ],
    priceColor: '#F8F802',
    btnColor: '#F8F802',
    buttonDisabled: false,
    buttonText: 'Upgrade to Pro',
  },
];
