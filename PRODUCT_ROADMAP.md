# 12-Month Product Roadmap

**Product:** Privacy-first AI-powered sports betting prediction platform
**Last Updated:** 2026-04-02
**Owner:** CPO

---

## Executive Summary

Build a profitable sports betting prediction product by capturing the privacy-conscious sports bettor segment. Revenue comes from freemium subscriptions with premium predictions.

---

## Now: 0-3 Months (MVP Launch & Market Entry)

**Goal:** Launch MVP, acquire first 100 users, validate product-market fit

### Launch Phase (Current)
- [ ] **CRITICAL:** Deploy MVP to production (blocked on CTO recovery)
- [ ] Execute launch day marketing
- [ ] Drive first 100 signups in week 1
- [ ] Verify paper trading functionality

### Core MVP Features
- NBA game predictions
- Paper trading (bet with fake money)
- Privacy-first positioning (no data selling)
- Email signup/waitlist

### Success Metrics
- 100 signups in week 1
- 20% Day-1 retention
- 10% Day-7 retention
- Paper trading engagement rate

---

## Next: 3-6 Months (Retention & Monetization)

**Goal:** Convert free users to paying customers, expand feature set

### Feature Expansion
1. **Premium Predictions Tier**
   - Full access to all predictions
   - Confidence scores
   - Historical accuracy stats
   - Price: $9.99/month

2. **Sports Expansion**
   - NFL (football)
   - MLB (baseball)
   - NHL (hockey)
   - College basketball

3. **User Retention Features**
   - Daily prediction emails
   - Custom alert settings
   - Favorite teams tracking
   - Prediction history

### Monetization Strategy
- Free tier: 3 predictions/day
- Premium tier: Unlimited predictions + exclusive insights
- First paying customer target: Month 4

### Success Metrics
- 500 active users
- 5% paid conversion
- $2,500 MRR by Month 6

---

## Later: 6-12 Months (Scale & Partnerships)

**Goal:** Scale user base, build moat through data partnerships and advanced ML

### Scale Initiatives
1. **Mobile App**
   - iOS app
   - Android app
   - Push notifications for live games

2. **Advanced Predictions**
   - Real-time odds integration
   - Player prop predictions
   - Parlay suggestions
   - Live game predictions

3. **Partnerships**
   - Sports data API (Stats Perform, SportRadar)
   - Sportsbook integrations (referral revenue)
   - Sports media partnerships

4. **Community Features**
   - User prediction sharing
   - Leaderboards
   - Social proof (win rate badges)

### Success Metrics
- 2,000 active users
- 10% paid conversion
- $10,000 MRR by Month 12
- 1 sportsbook partnership

---

## Revenue Model

| Tier | Price | Monthly | Annual (Save 30%) | Target User | Key Features |
|------|-------|---------|-------------------|-------------|---------------|
| Free | $0 | Free | Free | Curious users, paper traders | 3 NBA picks/day, 1hr delay, paper trading, basic stats |
| Basic | $9/mo | $9 | $75 | Recreational bettors | Real-time alerts, 7-day history, ROI tracking, daily digest |
| Pro | $19/mo | $19 | $159 | Serious bettors | Multi-sport (NFL/MLB/NHL), parlay builder, advanced analytics, best bets |
| Sharp Edge | $29/mo | $29 | $243 | Power users, syndicates | API access, custom webhooks, player props, live predictions, dedicated support |

**Dev Effort:** Basic (5wk) → Pro (10wk) → Sharp Edge (15wk+)

**Full details:** See [BETA-155#document-premium-roadmap](/BETA/issues/BETA-155#document-premium-roadmap)

---

## Key Risks

1. **CTO Recovery** - Current blocker for launch
2. **Prediction Accuracy** - Must deliver >55% to retain users
3. **Competitor Response** - Established players may copy privacy positioning
4. **Regulatory** - Sports betting regulations vary by state

---

## Priority Matrix

| Feature | User Value | Revenue Impact | Time to Market | Priority |
|---------|-----------|----------------|----------------|----------|
| MVP Launch | High | Critical | Blocked | P0 |
| Premium Tier | High | High | 2 weeks | P1 |
| NFL Expansion | Medium | Medium | 4 weeks | P2 |
| Mobile App | High | Medium | 8 weeks | P3 |
| Data Partnerships | Medium | High | 12 weeks | P4 |

---

## Top 3 Product Gaps (Current)

1. **No production deployment** - Revenue blocked until CTO recovers
2. **No monetization** - Free MVP only, no paid tier
3. **Single sport coverage** - NBA only, need NFL/MLB for full market

---

## Decisions Needed from CEO

1. ~~CTO recovery plan~~ - Board is handling (BETA-133)
2. ~~Premium tier pricing~~ - Defined in BETA-155: Basic $9/mo, Pro $19/mo, Sharp Edge $29/mo
3. Greenlight mobile app investment (Month 6-9)
4. Approve first-payer incentive (50% off first 50 subscribers)
