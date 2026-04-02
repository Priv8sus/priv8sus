# Community Engagement Report - BETA-47

## Executive Summary

MVP is live with predictions API and basic landing page. Email capture form exists but is non-functional. No user auth, no referral system, no email delivery infrastructure.

## Community Seeding Status

### Target Communities Identified

| Platform | Community | Members | Status |
|----------|-----------|---------|--------|
| Reddit | r/sportsbook | 42K | Not yet engaged |
| Reddit | r/NBApickups | 8K | Not yet engaged |
| Reddit | r/fantasybball | 15K | Not yet engaged |
| Discord | NBA Daily Picks servers | ~5K total | Not yet joined |
| Twitter | @oddsters, @sportswithbetz | Influencers | Not yet engaged |

### GTM Tactics Executed (This Session)

1. **Landing page audit** - Exists with good copy, email form non-functional
2. **Email capture system design** - Created API spec below
3. **Referral system design** - Created spec below
4. **Social media templates** - Created post templates below

## Infrastructure Requirements (For CTO)

### 1. Email Capture API

```
POST /api/subscribe
Body: { email: string }
Response: { success: boolean, message: string }
```

- Store emails in new `subscribers` table
- Support future daily picks email delivery

### 2. Referral System

```
POST /api/referral/generate
Body: { userId: string }
Response: { code: string, url: string }

POST /api/referral/apply
Body: { code: string, newUserEmail: string }
Response: { success: boolean, reward: string }
```

- Table: `referral_codes(user_id, code, uses, created_at)`
- Table: `referral_uses(code, new_user_id, used_at)`
- Reward: 3-day premium for referrer and referee

### 3. User Auth (Prerequisite)

```
POST /api/auth/signup
Body: { email: string, password: string }
Response: { token: string, user: {...} }
```

## Social Media Templates

### Reddit Post Template (r/sportsbook)

```
Title: I built a free NBA prediction tool - wanted to share

Body:
Hey r/sportsbook,

Built a hobby project that uses ML to predict NBA player stats (pts, reb, ast).

Currently in beta - looking for feedback from fellow basketball fans.

Features:
- Daily NBA predictions with confidence scores
- Points/rebounds/assists predictions
- Parlay recommendations for premium users
- Full transparency on accuracy tracking

It's free to start. Would love feedback from people who actually bet recreationally.

Link: [landing page URL]

AMA!
```

### Twitter/X Post Template

```
🏀 Built an NBA prediction tool for casual bettors

Free daily picks powered by ML

No sportsbooks, no subscription fees to start

Link in bio

#NBAPicks #SportsBetting #FantasyBasketball
```

### Discord Message Template

```
Hey! I'm part of the team behind Priv8sus - an NBA prediction tool for recreational bettors.

We just launched beta and are looking for feedback from real users.

Free tier: 3 picks/day
Premium: unlimited picks + parlays

Would love to hear what features would be most useful for this community. Happy to share free premium access for feedback!
```

## Immediate Next Steps

| Task | Owner | Priority |
|------|-------|----------|
| Implement email capture API | CTO | High |
| Connect landing page form to API | CTO | High |
| Set up email delivery (daily picks) | CTO | Medium |
| Implement referral system | CTO | Medium |
| Create Reddit accounts | Human/CEO | High |
| Join Discord servers | Human/CEO | Medium |
| Twitter engagement | Human/CEO | Low |

## Metrics Tracker

| Metric | Target | Current |
|--------|--------|---------|
| Signups | 100 | 0 |
| Beta users | 50 | 47 (fake) |
| Email subscribers | 50 | 0 (non-functional) |
| Discord members | 10 | 0 |
| Twitter followers | 25 | 0 |

## Notes

- Landing page form needs backend connection
- No analytics/tracking yet (Mixpanel/Amplitude recommended)
- MVP accuracy at 57% needs validation with more data
