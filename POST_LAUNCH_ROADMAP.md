# Post-Launch Feature Roadmap

**Product:** Privacy-first AI-powered sports betting prediction platform
**Owner:** CPO
**Last Updated:** 2026-04-02
**Context:** MVP launch imminent. This document identifies top 3 features to prioritize post-launch for user retention and monetization.

---

## Top 3 Post-Launch Features

### #1: Real-Time Predictions (Basic Tier - $9/mo)

**Why:** The 1-hour prediction delay is the #1 conversion friction. When users want to act on a prediction, they can't. Real-time access is the primary upgrade trigger.

**Revenue Impact:** HIGH — Basic tier at $9/mo is our first monetization milestone. First paying subscriber target: 30 days post-launch.

**Dev Effort:** ~5 weeks (remove delay gate, implement streaming updates)

**User Stories:**

```
AS A free user
I WANT to receive predictions immediately after they're generated
SO THAT I can act on them before games start

AS A free user
I WANT to see a "Real-Time Access" upgrade prompt when I click a prediction
SO THAT I understand the value of upgrading to Basic

AS A Basic subscriber
I WANT push notifications for new predictions
SO THAT I never miss an opportunity to paper trade
```

**Success Metrics:**
- 10% of free users upgrade within 30 days of real-time launch
- Basic tier: 25 subscribers in first 60 days
- Notification open rate > 40%

---

### #2: Multi-Sport Support (Pro Tier - $19/mo)

**Why:** NBA-only coverage limits addressable market. Football Sundays and baseball season drive massive betting volume. Users who bet multiple sports won't convert on NBA alone.

**Revenue Impact:** HIGH — Pro tier at $19/mo captures serious bettors. Multi-sport is the #1 requested feature from early testers.

**Dev Effort:** ~4 weeks per sport (NFL, MLB, NHL each ~3-4 weeks)

**User Stories:**

```
AS A free user
I WANT to see NFL predictions on Sundays
SO THAT I can use the product during football season

AS A Pro subscriber
I WANT to toggle between NBA, NFL, MLB, and NHL predictions
SO THAT I can focus on the sports I bet on

AS A Pro subscriber
I WANT parlay builder across multiple sports
SO THAT I can construct multi-sport parlays with your predictions
```

**Success Metrics:**
- 20% of subscribers add multi-sport within 60 days
- Pro tier adoption: 15 subscribers in first 90 days
- NFL launch drives 2x daily active users during season

---

### #3: ROI Tracking Dashboard (Basic/Pro Tier)

**Why:** Paper traders need to see their performance to believe the product works. ROI visualization converts skeptics and retains users long-term.

**Revenue Impact:** MEDIUM-HIGH — Users who track ROI stay engaged longer and upgrade more often. Reduces churn.

**Dev Effort:** ~1 week (backend analytics) + ~1 week (frontend dashboard)

**User Stories:**

```
AS A paper trader
I WANT to see my win/loss record across all bets
SO THAT I can validate whether the predictions are accurate

AS A paper trader
I WANT to filter ROI by sport, team, and prediction type
SO THAT I can identify where I'm winning and losing

AS A Basic subscriber
I WANT to compare my ROI to the platform's overall accuracy
SO THAT I know if I'm beating the house
```

**Success Metrics:**
- 50% of active paper traders view ROI dashboard weekly
- Users who view ROI dashboard have 30% higher retention
- Upgrade conversion rate 25% higher among ROI dashboard users

---

## Feature Priority Matrix

| Feature | User Value | Revenue Impact | Time to Market | Dev Effort | Priority |
|---------|------------|-----------------|----------------|------------|----------|
| Real-Time Predictions | HIGH | HIGH | 5 weeks | Medium | #1 |
| Multi-Sport (NFL/MLB) | HIGH | HIGH | 8 weeks | High | #2 |
| ROI Dashboard | MEDIUM | MEDIUM-HIGH | 2 weeks | Low | #3 |

---

## Recommended Launch Sequence

### Phase 1 (Weeks 1-5 post-launch)
- **Real-time predictions** — Primary conversion driver, ship first
- Add upgrade prompts at prediction delay friction points
- A/B test pricing: $9/mo vs $89/yr (save 17%)

### Phase 2 (Weeks 6-13)
- **NFL expansion** — Capture football season demand
- Launch ahead of NFL Week 1 (August)
- Bundle NFL + NBA in Pro tier

### Phase 3 (Weeks 10-15)
- **ROI Dashboard** — Retention and engagement tool
- Email weekly ROI digest to inactive users
- Social proof: "Top traders this week" leaderboard

---

## Risk Considerations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Real-time delay harder than estimated | Medium | Build on existing prediction pipeline, don't redesign |
| NFL model accuracy lower than NBA | Medium | Launch with confidence scores, be transparent about accuracy |
| Users churn before converting | High | Aggressive email sequence, reminder notifications at 7/14/30 days |

---

## Dependencies

- **CTO:** Real-time infrastructure, Stripe integration
- **CMO:** Pricing page updates, launch messaging for NFL expansion
- **Tech Support:** Monitoring for prediction pipeline uptime

---

## Next Steps

1. [ ] **CTO:** Review dev estimates for real-time predictions
2. [ ] **CTO:** Confirm NFL data pipeline status
3. [ ] **CMO:** Draft upgrade prompt copy for real-time feature lock
4. [ ] **CEO:** Approve $9/mo Basic tier pricing

---

*Document: BETA-191 Post-Launch Feature Improvements*
*Owner: CPO*
