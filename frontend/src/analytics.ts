import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_example';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export function initAnalytics() {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (pg) => {
      pg.opt_in_capturing();
    },
  });
}

export function setUserId(userId: number, properties?: Record<string, unknown>) {
  posthog.identify(userId.toString(), properties);
}

export function clearUserId() {
  posthog.reset();
}

export function capturePageView(page: string, properties?: Record<string, unknown>) {
  posthog.capture('$pageview', {
    page,
    ...properties,
  });
}

export function captureSignup(userId: number, email: string, method: 'email' | 'google' = 'email') {
  posthog.capture('signup_completed', {
    user_id: userId,
    email_hash: email.toLowerCase().trim(),
    signup_method: method,
  });
}

export function captureLogin(userId: number) {
  posthog.capture('login_completed', {
    user_id: userId,
  });
}

export function captureFirstPrediction(userId: number, playerId: number, playerName: string, confidence: number) {
  posthog.capture('first_prediction_placed', {
    user_id: userId,
    player_id: playerId,
    player_name: playerName,
    confidence,
  });
}

export function capturePaperTrade(userId: number, playerId: number, playerName: string, stake: number, odds: number, payout: number) {
  posthog.capture('paper_trade_placed', {
    user_id: userId,
    player_id: playerId,
    player_name: playerName,
    stake,
    odds,
    potential_payout: payout,
  });
}

export function captureUpgradeToPremium(userId: number, priceId: string) {
  posthog.capture('upgrade_to_premium', {
    user_id: userId,
    price_id: priceId,
  });
}

export function captureOnboardingComplete(userId: number) {
  posthog.capture('onboarding_completed', {
    user_id: userId,
  });
}

export function captureTourComplete(userId: number) {
  posthog.capture('tour_completed', {
    user_id: userId,
  });
}

export { posthog };
