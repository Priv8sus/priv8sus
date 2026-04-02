export interface User {
  id: number;
  email: string;
  subscriptionTier: 'free' | 'premium';
  createdAt: string;
  onboardingCompleted?: boolean;
  firstLoginAt?: string;
  isFirstLogin?: boolean;
  tourCompleted?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
}

export interface SubscriptionInfo {
  tier: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isActive: boolean;
  tiers: {
    free: TierInfo;
    premium: TierInfo;
  };
}

export interface TierInfo {
  name: string;
  price: number;
  priceId?: string;
  features: string[];
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: SubscriptionInfo;
  checkoutUrl?: string;
  error?: string;
}
