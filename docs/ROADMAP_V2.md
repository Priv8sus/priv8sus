# Product Roadmap v2: Post-Launch Revenue Focus

**Last Updated:** April 3, 2026

**Recent CPO Additions:**
- Competitor Teardown (April 3, 2026): Deep analysis of Outlier, Polymarket, Action Network. See [COMPETITOR_TEARDOWN.md](../../COMPETITOR_TEARDOWN.md)
**Owner:** Chief Product Officer
**Goal:** Predict sports markets and be profitable

---

## Executive Summary

**MVP CODE COMPLETE** ✅ — All critical features delivered. Deployment blocked on board action (BETA-94).

**Status:** Launch ready but not yet live. Awaiting board to complete Railway/Vercel deployment.

**North Star:** First paying subscriber in 30 days post-deployment. MRR > $500 in 90 days post-deployment.

**Key Learnings from Launch Prep:**
- CTO has been unstable (multiple ERROR states) — deployment critical path
- Auth backend complete and functional
- QA validation passed with all tests green
- Onboarding flow ready but not yet activated (needs deployment)
- Stripe setup blocked on human dashboard access

---

## Now (0-3 months): MVP Launch + First Revenue

**Goal:** Get MVP live, validate demand, convert first paying customers

### Status: LAUNCH READY (code complete)
| Component | Status |
|-----------|--------|
| Sports Player Stats Estimator (BETA-11) | ✅ Done |
| Paper Trading Engine (BETA-16) | ✅ Done |
| Frontend Dashboard (BETA-29) | ✅ Done |
| Code Hardening (BETA-41) | ✅ Done |
| QA Validation (BETA-65) | ✅ Done |
| Auth Backend (BETA-66) | ✅ Done |
| Onboarding Flow (BETA-96, 97, 98, 99) | ✅ Done |
| Analytics Infrastructure (BETA-119) | ✅ Done |
| Deployment (BETA-73) | ⏳ Pending board action |

### Immediate Post-Launch Priorities

| Priority | Feature | Revenue Impact | Target |
|----------|---------|----------------|--------|
| P0 | **Stripe Integration** | Enables monetization | Week 1-2 |
| P0 | **Basic Tier ($9/mo)** | First paid product | Week 2 |
| P1 | **Real-time Predictions** | Basic tier differentiator | Week 3-4 |
| P1 | **Conversion Funnel** | Free → Paid upgrade | Week 3-4 |
| P2 | **Email Drip Campaign** | User retention | Week 4-5 |

### Launch Blockers
- **BETA-94**: Board must complete Railway/Vercel OAuth deployment — CRITICAL PATH
- **BETA-233**: Stripe Price IDs needed (Basic $9, Pro $19) — human action required

### Immediate Post-Deployment Priorities (Week 1-2)

| Priority | Action | Owner | Revenue Impact |
|----------|--------|-------|----------------|
| P0 | Verify deployment live | Tech Support | Enables all revenue |
| P0 | Activate Stripe Basic tier ($9/mo) | CEO human | First paid product |
| P1 | Launch onboarding flow | CTO | Day 1 retention |
| P1 | Deploy email welcome sequence | CTO | Day 3 retention |
| P2 | Verify analytics tracking | CTO | Measure success |
| P2 | A/B test landing page variants | CMO | Improve conversion |

---

## Next (3-6 months): Monetization & Retention

**Goal:** Scale paying subscriber base, improve conversion

### Milestones
| Month | Milestone | Revenue Target |
|-------|-----------|----------------|
| Month 1 | First 10 paying subscribers | $90 MRR |
| Month 2 | First 25 subscribers | $225 MRR |
| Month 3 | 50 subscribers + Pro tier launch | $500 MRR |

### Feature Roadmap by Tier

#### Basic Tier ($9/mo) — Launch First
| Feature | Dev Effort | Why It Matters |
|---------|-------------|----------------|
| Real-time predictions (no delay) | 2 weeks | Primary conversion driver |
| 7-day prediction history | 3 days | Retention feature |
| ROI tracking dashboard | 1 week | Shows paper trading value |
| Daily email digest | 1 week | Engagement driver |

#### Pro Tier ($19/mo) — Launch at Month 2-3
| Feature | Dev Effort | Why It Matters |
|---------|-------------|----------------|
| Multi-sport (NFL, MLB) | 4 weeks | Football season capture |
| Parlay builder | 2 weeks | Advanced betting feature |
| Historical accuracy stats | 1 week | Social proof for conversion |
| Best bet highlights | 2 days | Daily engagement hook |

### Retention Features (All Tiers)
| Feature | Impact |
|---------|--------|
| Welcome email sequence | Day 0, 3, 7, 14 drip |
| Onboarding tour | First-time user activation |
| Favorite team alerts | Daily engagement |
| Discord community | User community building |

---

## Later (6-12 months): Scale & Partnerships

**Goal:** 500+ subscribers, explore B2B revenue

### Milestones
| Quarter | Milestone | MRR Target |
|---------|-----------|------------|
| Q2 | 100 paying subscribers | $1,500 |
| Q3 | 250 subscribers + API tier | $3,500 |
| Q4 | 500 subscribers + 1 partnership | $7,500+ |

### Multi-Sport Expansion
| Sport | Priority | Launch Target |
|--------|----------|---------------|
| NFL | P1 | September (football season) |
| MLB | P2 | April (baseball season) |
| NHL | P3 | Q4 2026 |
| CBB | P3 | March 2027 |

### B2B Opportunities
| Channel | Revenue Potential |
|---------|-------------------|
| Sportsbook API licensing | $500-$5,000/mo |
| Media data partnerships | $1,000-$3,000/mo |
| White-label product | $2,000-$10,000/mo |

---

## Revenue Model

### Tier Architecture
| Tier | Price | Monthly | Annual | Target User |
|------|-------|---------|--------|-------------|
| Free | $0 | Free | Free | Validation users |
| Basic | $9 | $9/mo | $75/yr | Recreational bettors |
| Pro | $19 | $19/mo | $159/yr | Serious bettors |
| Sharp Edge | $29 | $29/mo | $243/yr | Power users/API |

### Revenue Projections
| Scenario | Month 1 | Month 3 | Month 6 | Month 12 |
|----------|---------|---------|---------|----------|
| Conservative (10 Basic) | $90 | $225 | $500 | $2,000 |
| Expected (25 Basic + 5 Pro) | $305 | $605 | $1,500 | $4,000 |
| Optimistic (50 Basic + 15 Pro) | $735 | $1,155 | $2,500 | $7,500 |

---

## Top 3 Post-Launch Gaps (Updated)

1. **CTO Stability** — CTO has errored 5+ times during launch prep. Deployment is the critical path and CTO is the only one who can do it. If CTO remains unstable, consider escalating to board for direct intervention or hiring additional engineering capacity.

2. **Stripe Integration** — Cannot monetize without it. BETA-233 is blocked waiting for human to access Stripe dashboard and get Price IDs. This is the #1 revenue blocker post-deployment.

3. **Real-time Predictions** — Basic tier differentiator. Currently free users have 1-hour delay on predictions. Real-time access is the primary upgrade trigger. Estimated 5 weeks dev time. This is what will convert free users to paying $9/mo subscribers.

### Multi-sport Warning
NFL season starts September 2026. We have ~5 months to add NFL support for Pro tier ($19/mo). If we miss the football season window, we lose the highest-betting-volume sports segment until next year.

---

## MVP Ship Criteria (Review)

**Original criteria (all met):**
1. ✅ API returns today's NBA games with teams and rosters
2. ✅ Prediction engine outputs probability scores
3. ✅ Dashboard displays predictions alongside season averages
4. ✅ Predictions stored and matched to actuals
5. ✅ Accuracy metrics (MAE) calculated and visible

**Post-launch ship criteria:**
- Analytics tracking verified (GA4, funnel)
- Sentry error tracking active
- Email infrastructure (Resend) configured
- Stripe integration staged for activation

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CTO ERROR state (recurring) | **HIGH** | **CRITICAL** | Board must intervene if CTO cannot recover. Consider direct board deployment or hiring backup engineer. |
| Deployment delay | **HIGH** | **CRITICAL** | BETA-94 blocked on board completing Railway/Vercel OAuth |
| CTO instability post-launch | Medium | High | Have runbook ready for CTO recovery |
| Stripe human action delay | Medium | High | CEO must prioritize Stripe dashboard setup |
| Low conversion rate | Medium | High | A/B test landing variants, focus on onboarding |
| Single sport limitation | High | Medium | NFL expansion in roadmap — September deadline |
| Low email deliverability | Low | Medium | Test with Resend before launch |

---

## Next 90-Day Actions (Post-Deployment)

### Week 1-2: Launch & Stabilize
- [ ] **Board completes deployment (BETA-94)** — CRITICAL PATH
- [ ] Tech Support verifies MVP live at production URL
- [ ] Confirm analytics tracking working (GA4, funnel)
- [ ] CEO completes Stripe dashboard setup (BETA-233) — get Price IDs
- [ ] Activate Basic tier ($9/mo) in Stripe
- [ ] Launch onboarding flow (BETA-96, 97, 98, 99)

### Week 3-4: First Revenue
- [ ] Verify email welcome sequence working (Day 0, 1, 3)
- [ ] Deploy conversion prompts in-app at friction points
- [ ] Launch "first 10 subscribers" campaign (CMO)
- [ ] First paying subscriber target: **Day 21 post-deployment**

### Month 2: Scale to 25 Subscribers
- [ ] Email drip sequence fully operational
- [ ] Begin real-time predictions development (Basic tier P0)
- [ ] 25-subscriber milestone: **$225 MRR**

### Month 3: Pro Launch + NFL Prep
- [ ] Real-time predictions live for Basic tier subscribers
- [ ] Launch Pro tier ($19/mo) with multi-sport early access
- [ ] Begin NFL model development (deadline: August for September launch)
- [ ] 50-subscriber milestone: **$500 MRR**

---

## Launch Readiness Checklist (Before We Can Call "Live")

- [ ] **BETA-94** — Board completes Railway/Vercel deployment ✅
- [ ] Production URL accessible and SSL verified ✅
- [ ] Login/signup flow functional ✅
- [ ] Predictions display correctly on dashboard ✅
- [ ] Paper trading works end-to-end ✅
- [ ] Analytics tracking verified ✅
- [ ] Email infrastructure (Resend) configured ✅
- [ ] Stripe products created and Price IDs documented ✅
- [ ] Onboarding flow activated ✅

**Status:** Waiting on BETA-94 (board action) to proceed.

---

*This roadmap reflects reality post-MVP launch. Focus is revenue, revenue, revenue.*
*CPO declaring: MVP complete. Time to make money.*
