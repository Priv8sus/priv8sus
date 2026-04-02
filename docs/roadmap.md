# Product Roadmap: Predict Sports Markets and Be Profitable

**Last Updated:** April 2026
**Owner:** Chief Product Officer
**Goal:** Predict sports markets and be profitable

---

## Executive Summary

Build a profitable sports betting prediction product. Every feature ladders back to revenue.

**North Star:** Help users make better betting decisions through accurate predictions, then monetize through subscriptions and partnerships.

---

## Now (0-3 months): MVP Launch

**Goal:** Ship core product, validate prediction accuracy, get first users

### Milestones
- [x] **MVP Dashboard Live** — BETA-29 complete with real NBA data
- [x] **First Users** — CMO launches GTM (BETA-34), target 100 users in 30 days
- [x] **Prediction Accuracy Visible** — MAE/calibration displayed on dashboard
- [x] **Daily Data Pipeline** — Automated NBA data refresh
- [ ] **MVP Complete** — Waiting on BETA-40 (fallback NBA API) to ship

### MVP Scope (revised from BETA-11)
| Feature | Status | Revenue Impact |
|---------|--------|----------------|
| Data ingestion (BETA-12) | Done | — |
| NBA games + player list (BETA-25) | Done | — |
| Season averages | Done | — |
| Points/rebs/asts predictions (BETA-26) | Done | — |
| Accuracy tracking (BETA-28) | Done | — |
| Frontend dashboard (BETA-29) | Done | — |
| Paper trading (BETA-30) | Done | — |
| MVP hardening (BETA-41) | Done | — |
| Community engagement (BETA-42) | Done | — |
| Fallback NBA API (BETA-40) | IN PROGRESS | **Critical blocker** |

### What We Cut for MVP
- News/injury scraping — deferred post-MVP
- Steals/blocks/3PT predictions — MVP uses basic 3 stats first

### Success Metrics
- Dashboard loads with < 3s response time
- 100 registered users
- 30-day retention > 20%
- Prediction accuracy > 55% on points

---

## Next (3-6 months): Retention & Monetization

**Goal:** Convert free users to paying customers, increase engagement

### Milestones
- [x] **Paper Trading Launch** — BETA-30 live, users simulate bets
- [x] **Subscription Tiers** — Premium features defined (BETA-86 plan complete)
- [ ] **Stripe Integration** — Payment infrastructure for premium tiers
- [ ] **User Accounts** — Saved preferences, prediction history
- [ ] **Push Notifications** — Game alerts, prediction updates

### Key Features
| Feature | Revenue Impact |
|---------|----------------|
| Paper trading simulation | Engagement driver |
| Premium subscription ($9.99/mo) | Direct revenue |
| Additional stats (steals, blocks, 3PT) | Feature differentiation |
| News/injury display | User value |

### Success Metrics
- 10% free-to-paid conversion
- MRR > $500
- DAU/MAU > 30%
- Paper trading participation > 40% of users

---

## Later (6-12 months): Scale & Partnerships

**Goal:** Grow revenue, explore B2B opportunities

### Milestones
- [ ] **Multi-Sport Expansion** — NFL, MLB predictions
- [ ] **Sportsbook Partnership** — Revenue share or API licensing
- [ ] **Advanced ML Models** — Improve prediction accuracy > 60%
- [ ] **B2B API** — Sell data to sportsbooks, media

### Key Features
| Feature | Revenue Impact |
|---------|----------------|
| NFL/MLB predictions | User acquisition |
| Partnership deals | B2B revenue |
| White-label product | Enterprise sales |
| Real betting integration | Transaction revenue* |

*Only if legal framework permits

### Success Metrics
- 1,000+ paying subscribers
- MRR > $5,000
- At least 1 partnership deal signed
- Prediction accuracy > 60%

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic predictions, paper trading, accuracy stats |
| Basic | $9/mo or $89/yr | Real-time alerts, 7-day history, ROI tracking |
| Pro | $19/mo or $189/yr | Multi-sport, parlay builder, advanced analytics |
| Sharp Edge | $29/mo or $279/yr | API access (1000 calls/day), custom alerts, dedicated support |

**B2B:** Data API licensing to sportsbooks/media — $500-$5,000/mo

---

## Top 3 Gaps in Current Product

1. **NBA API reliability** — BETA-40 in progress; need fallback API before launch
2. **No monetization** — Need subscription infrastructure post-MVP
3. **Single sport only** — NBA only, need NFL/MLB for scale

---

## MVP Ship Criteria

1. API returns today's NBA games with teams and rosters
2. Prediction engine outputs probability scores for points/rebounds/assists per player
3. Dashboard displays predictions alongside season averages
4. Predictions stored and matched to actuals after games complete
5. Accuracy metrics (MAE) calculated and visible

**Status:** Criteria 1-5 are complete. MVP ship blocked on BETA-40 (fallback NBA API). API key obtained, Engineer resuming work.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| NBA API reliability | BETA-40 fallback API in progress; balldontlie key available |
| Data accuracy | Validate against historical data before launch |
| User acquisition | CMO's GTM plan (BETA-34) complete, community engaged |
| Legal compliance | Consult on sports betting regulations |

---

*This roadmap is a living document. Update quarterly or when strategic direction changes.*
