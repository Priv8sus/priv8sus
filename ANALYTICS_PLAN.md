# Analytics Plan: Priv8sus MVP Launch

**Owner:** Chief Product Officer  
**Last Updated:** April 2026  
**Status:** Ready for CTO Implementation

---

## Overview

This document specifies the analytics tracking requirements for MVP launch. The goal is to measure user acquisition funnel effectiveness and demonstrate ROI to stakeholders.

---

## Current State

The backend analytics system (`api/src/analytics.ts`) exists with:
- Event tracking: `user_signup`, `user_login`, `prediction_viewed`, `paper_trade_placed`, `premium_upgrade`, `premium_cancelled`
- API endpoints for DAU, signups, retention, paper trades

**Missing:**
- Frontend page view tracking
- Email waitlist conversion funnel
- Waitlist-to-paid conversion tracking

---

## Required Tracking

### 1. Page View Tracking

| Event | Properties | Revenue Impact |
|-------|------------|----------------|
| `page_view` | `page`, `referrer`, `user_id` (if authenticated) | Funnel visibility |

**Pages to Track:**
- `/` (Landing page)
- `/dashboard` (Main app)
- `/login` (Login page)
- `/signup` (Signup page)

**Implementation:**
- Frontend: Add `trackPageView(page, referrer)` call on route changes
- Backend: `POST /api/analytics/page-view` with `{ page, referrer, user_id? }`

### 2. Email Signup Conversion Tracking

| Event | Properties | Revenue Impact |
|-------|------------|----------------|
| `waitlist_attempted` | `email`, `source: 'landing_page' | 'cta_section'` | Baseline volume |
| `waitlist_succeeded` | `email`, `source` | Conversion from visit |
| `waitlist_failed` | `email`, `error_reason` | Failure analysis |

**Funnel:**
1. Landing page visit
2. Email enter → `waitlist_attempted`
3. API success → `waitlist_succeeded`
4. API failure → `waitlist_failed`

**Source Tracking:**
- `landing_page` = hero form
- `cta_section` = bottom CTA form

### 3. Waitlist-to-Paid Conversion Tracking

| Event | Properties | Revenue Impact |
|-------|------------|----------------|
| `waitlist_to_signup_started` | `email` | Funnel drop-off point |
| `signup_completed` | `user_id`, `email` | Account creation |
| `subscription_viewed` | `user_id`, `tier_viewed` | Monetization intent |
| `checkout_started` | `user_id`, `price_id`, `tier` | High intent signal |
| `premium_upgrade` | `user_id`, `subscription_id`, `tier` | **Revenue event** |
| `premium_cancelled` | `user_id`, `subscription_id` | Churn event |

**Funnel:**
1. Waitlist signup success
2. User later returns → `/login` or `/signup`
3. Signup form → `signup_completed`
4. Browse to subscription page → `subscription_viewed`
5. Click upgrade → `checkout_started`
6. Stripe success webhook → `premium_upgrade`

---

## Backend API Specification

### New Endpoints

```
POST /api/analytics/page-view
Body: { page: string, referrer?: string, user_id?: number }

POST /api/analytics/track
Body: { event: string, properties?: Record<string, any>, user_id?: number }
```

### Analytics Dashboard (Future)

Metrics to expose via `/api/analytics/dashboard`:
- Daily unique visitors
- Waitlist conversion rate (page_views → waitlist_succeeded)
- Signup rate (waitlist → signup_completed)
- Upgrade rate (signups → premium_upgrade)
- Revenue (premium_upgrade events × $29/mo)

---

## Implementation Priority

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Page view tracking | Measures GTM effectiveness |
| P0 | Waitlist conversion tracking | Core funnel measurement |
| P0 | Signup tracking | Account creation baseline |
| P1 | Subscription page tracking | Monetization intent |
| P1 | Checkout tracking | Revenue funnel |
| P2 | Analytics dashboard | Stakeholder visibility |

---

## CTO Deliverables

1. **Frontend tracking** — Add page view tracking to React router
2. **Backend endpoints** — Implement `POST /api/analytics/page-view` and `POST /api/analytics/track`
3. **Event persistence** — Store events in `events` table with metadata JSON
4. **Stripe webhook** — Already exists, verify `premium_upgrade` events firing

---

## Revenue Metrics

The analytics must support calculating:
- **CAC** = Marketing spend / waitlist_succeeded
- **LTV** = avg_subscription_duration × $29
- **Conversion rates** at each funnel step

---

## Dependencies

- Frontend routing (React Router or equivalent)
- Existing `events` table schema
- Stripe webhook endpoint (already implemented)

---

## Out of Scope for MVP

- A/B testing infrastructure
- Custom event builder UI
- Real-time dashboard
- Email open/click tracking (handled by Resend)
