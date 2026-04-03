# Launch Metrics Dashboard - Week 1

**Owner:** CMO  
**Status:** Ready for Tracking  
**Launch Date:** TBD  

---

## Week 1 Targets

| Metric | Target | Stretch | Current |
|--------|--------|---------|---------|
| Total Signups | 50 | 75 | - |
| Referrals | 20 | 30 | - |
| Referral Conversion Rate | 15% | 25% | - |
| First Predictions Made | 30 | 45 | - |
| Email Open Rate | 40% | 50% | - |
| Premium Upgrades | 5 | 10 | - |

---

## Conversion Funnel

```
Visit Landing Page
    ↓ (page_view)
Email Waitlist Signup → waitlist_succeeded
    ↓ (~20-30% conversion)
Email Verified
    ↓ 
First Prediction Made → first_prediction_placed
    ↓
Referral Share → referral_initiated
    ↓ (friend signs up)
Referral Conversion → referral_completed
    ↓
Premium Upgrade → upgrade_to_premium
```

---

## PostHog Events Inventory

### Already Implemented ✅

| Event | Properties | Trigger |
|-------|------------|---------|
| `pageview` | page, referrer | Route change |
| `subscribe_completed` | email_hash, source | Waitlist signup |
| `signup_completed` | user_id, email_hash, signup_method | Account creation |
| `login_completed` | user_id | Login |
| `dashboard_today` / `dashboard_history` | - | Tab switch |
| `paper_trade_placed` | user_id, player_id, stake, odds, potential_payout | Paper trade |
| `first_prediction_viewed` | user_id, player_id, player_name, confidence | First prediction viewed |
| `upgrade_to_premium` | user_id, price_id | Stripe success |
| `onboarding_completed` | user_id | Onboarding finish |
| `tour_completed` | user_id | Tour finish |

### Missing - Needs CTO Implementation ❌

| Event | Properties | Notes |
|-------|------------|-------|
| `first_prediction_placed` | user_id, player_id, player_name, confidence | Track first-ever prediction per user |
| `referral_signup` | referrer_id, referee_id, source | When referee completes signup with code |
| `referral_converted` | referrer_id, referee_id | When referee makes first prediction |
| `waitlist_to_signup` | email, days_to_convert | Funnel tracking |

---

## Backend Analytics (api/src/analytics.ts)

### Already Implemented ✅

- `trackEvent(eventType, userId, metadata)` - Generic event tracking
- `getDailyActiveUsers(date)` - DAU count
- `getSignupsSince(since)` - Signup count
- `getPaperTradesCount(since?)` - Paper trade count
- `getRetentionStats(day)` - 1/7/30 day retention

### Missing ❌

- `getReferralStats(since)` - Referral conversion metrics
- `getConversionFunnel(startDate)` - Funnel step counts
- `getWaitlistToSignupRate()` - Waitlist conversion rate

---

## Tracking Implementation Checklist

- [x] PostHog initialized with VITE_POSTHOG_KEY
- [x] Page view tracking on dashboard/landing
- [x] Subscribe tracking on waitlist form
- [x] Paper trade tracking
- [ ] **First prediction tracking** - Need to add to paper trade flow
- [ ] **Referral tracking** - Need backend + frontend implementation
- [ ] **Analytics dashboard API** - Need `/api/analytics/dashboard` endpoint

---

## First Prediction Tracking Fix

**Problem:** `captureFirstPrediction()` exists in `frontend/src/analytics.ts` but is never called.

**Solution:** Add first prediction tracking to `TopPredictions.tsx` paper trade flow:

```typescript
// After successful paper trade in handlePaperTrade():
if (user) {
  // Check if first prediction (need backend or localStorage check)
  if (isFirstPrediction) {
    captureFirstPrediction(user.id, player.playerId, player.playerName, player.confidence);
  }
  capturePaperTrade(user.id, player.playerId, player.playerName, 10, odds, result.potentialPayout || 0);
}
```

**Option A (Frontend):** Use localStorage to track "hasPlacedPrediction_{userId}"  
**Option B (Backend):** Call `/api/users/{userId}/has_placed_prediction` before tracking

---

## Referral Tracking Implementation

**Requirements:**
1. When user shares referral link → track `referral_shared` event
2. When referee signs up with code → track `referral_signup` event
3. When referee makes first prediction → track `referral_converted` event

**Backend needs:**
- `GET /api/analytics/referrals?since=DATE` - Referral stats
- Store `referrer_id` on user record when signing up with code

---

## Launch Dashboard Metrics to Display

1. **Signups Today / Week** - Counter
2. **Referrals Today / Week** - Counter with conversion rate
3. **Waitlist → Signup Rate** - Percentage
4. **DAU (Daily Active Users)** - Counter
5. **First Predictions Made** - Counter
6. **Premium Upgrades** - Counter with revenue

---

## Dependencies

- **CTO:** Implement first prediction tracking fix, referral tracking, dashboard API
- **Frontend:** Add referral share tracking, dashboard widgets
- **Data:** PostHog project configured with keys in production

---

## Status: Ready for CTO Implementation

The analytics foundation is in place (PostHog, event tracking). The missing pieces are:
1. First prediction tracking (frontend + backend)
2. Referral conversion tracking (full stack)
3. Launch metrics dashboard API endpoint

**BETA-264: Analytics Setup for Launch - CTO implementation needed for items marked ❌**
