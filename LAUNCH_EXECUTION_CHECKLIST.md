# Launch Execution Checklist & Pre-Launch Verification

**Document Version:** 1.0
**Last Updated:** April 3, 2026
**Owner:** Chief Product Officer (CPO)
**Status:** LAUNCH READY (awaiting deployment)

---

## Executive Summary

**MVP Status:** CODE COMPLETE ✅  
**Deployment Status:** BLOCKED on BETA-73 (CTO/Board action required)  
**Stripe Status:** BLOCKED on human dashboard access (BETA-233)  
**Path to Revenue:** Clear — deploy first, then activate Stripe

---

## Phase 1: Pre-Launch Verification (Current)

### 1.1 Code & QA Verification ✅

| Component | Issue | Status | Notes |
|-----------|-------|--------|-------|
| Sports Player Stats Estimator | BETA-11 | ✅ Done | NBA player stats, season averages |
| Paper Trading Engine | BETA-16 | ✅ Done | Simulated betting with track record |
| Frontend Dashboard | BETA-29 | ✅ Done | React + Vite, predictions display |
| Code Hardening | BETA-41 | ✅ Done | Security audit passed |
| QA Validation | BETA-65 | ✅ Done | All 28 test cases passed |
| Auth Backend | BETA-66 | ✅ Done | JWT-based, user registration/login |
| Onboarding Flow | BETA-96,97,98,99 | ✅ Done | Welcome screen, guided tour, email sequence |

**Verification:** All tests passing. QA complete. Code ready for deployment.

### 1.2 Pre-Deployment Blockers

| Blocker | Issue | Owner | Action Required |
|---------|-------|-------|----------------|
| **CRITICAL** Deploy MVP | BETA-73 | CTO/Board | Complete Railway + Vercel deployment |
| Stripe Setup | BETA-233 | CEO (Human) | Create products at stripe.com |

### 1.3 Environment & Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| .env.production configured | ✅ Ready | See ENV_VARS_CHECKLIST.md |
| GitHub repo up to date | ✅ Ready | github.com/Priv8sus/priv8sus |
| Railway account + OAuth | ⏳ Pending | Board action (BETA-73) |
| Vercel account + OAuth | ⏳ Pending | Board action (BETA-73) |
| Domain configured | ⏳ Pending | priv8sus.com or subdomain |
| SSL/HTTPS | ⏳ Pending | Auto-provided by Railway/Vercel |

---

## Phase 2: Launch Day Execution

### 2.1 Hour 0: Deployment Verification

**Owner: Tech Support / CTO**

```
□ MVP is live at production URL
□ SSL/HTTPS verified (green padlock)
□ API health endpoint responds: /api/health
□ Frontend loads without errors
□ Database connectivity confirmed
```

**Verification Commands:**
```bash
# API Health
curl https://<railway-url>/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend Load
curl -I https://<vercel-url>
# Expected: 200 OK

# Database
curl https://<railway-url>/api/predictions
# Expected: JSON response (not 500 error)
```

### 2.2 Hour 1: User Flow Verification

**Owner: CPO (Product Verification)**

```
□ Landing page loads correctly
□ Sign up flow works end-to-end
  □ Email input → submit → confirmation
  □ Password creation → accepted
  □ Welcome email sent (check inbox)
□ Login flow works
  □ Email + password → dashboard access
□ Dashboard displays
  □ NBA predictions visible
  □ Player stats displayed
  □ Paper trading interface accessible
□ First prediction interaction
  □ Click on game → see prediction
  □ Paper trade button works
```

### 2.3 Hour 2: Marketing Execution

**Owner: CMO**

```
□ Launch announcement posted to Twitter/X
□ Launch posted to Reddit (r/sportsbook, r/nba)
□ Email sent to waitlist
□ Influencer DMs sent (see outreach list)
□ Social media monitoring active
□ Early reactions tracked and documented
```

### 2.4 Hour 3-4: Stripe & Monetization Setup

**Owner: CEO (Human Action Required)**

**IF Stripe Account Ready:**
```
□ Log into dashboard.stripe.com
□ Verify Basic product ($9/mo) created
□ Verify Pro product ($19/mo) created
□ Copy Price IDs (price_xxx format)
□ Document Price IDs in BETA-225 plan
□ Share STRIPE_SECRET_KEY with CTO
□ Verify Stripe test mode working
```

**FALLBACK (If Stripe Not Ready):**
```
□ Launch with FREE tier only
□ Display "Premium coming soon" messaging
□ Prepare upgrade prompts for Day 7 post-launch
□ Document Stripe keys needed in BETA-233 comments
```

---

## Phase 3: Post-Launch Week 1

### Day 1 (April X)

| Time | Task | Owner | Status |
|------|------|-------|--------|
| Morning | Monitor error rates | Tech Support | ⏳ |
| Morning | First user signups confirmed | Tech Support | ⏳ |
| Afternoon | Respond to early feedback | CPO/CMO | ⏳ |
| Evening | Post follow-up content | CMO | ⏳ |

**Day 1 Metrics to Track:**
- Signups: Target 10
- Error rate: < 1%
- Page load time: < 3s

### Day 2-3

| Task | Owner | Status |
|------|-------|--------|
| Analyze early user behavior | CPO | ⏳ |
| Identify top issues from feedback | CPO | ⏳ |
| Begin Reddit AMAs | CMO | ⏳ |
| Day 1 follow-up email ("How was your first prediction?") | CTO | ⏳ |
| Verify email deliverability | CTO | ⏳ |

### Day 4-7

| Task | Owner | Status |
|------|-------|--------|
| Day 3 email ("3 predictions - how accurate were we?") | CTO | ⏳ |
| Review accuracy metrics vs. claims | CPO | ⏳ |
| Assess signup pace vs. 100-user week goal | CPO | ⏳ |
| Escalate blockers if behind pace | CPO → CEO | ⏳ |
| Stripe integration (if not done Day 1) | CEO | ⏳ |

---

## Phase 4: Launch Success Criteria

### 4.1 MVP Launch Criteria (Must Meet)

| Criterion | Target | How Measured |
|-----------|--------|--------------|
| **Deployment Live** | ✅ Production URL accessible | Tech Support verification |
| **SSL/HTTPS** | ✅ Green padlock | Browser check |
| **Signup Flow** | ✅ Works end-to-end | Manual test |
| **Login Flow** | ✅ Works end-to-end | Manual test |
| **Predictions Display** | ✅ NBA games + stats shown | Dashboard check |
| **Paper Trading** | ✅ Can place simulated bets | UI test |
| **Error Rate** | < 1% of requests | Railway logs |
| **Response Time** | < 3 seconds | Browser DevTools |

### 4.2 Week 1 Success Metrics

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| Signups | 25 | 100 | 200 |
| Daily Active Users | 10 | 50 | 100 |
| Paper Trades | 5 | 25 | 50 |
| Email Opens | 50% | 65% | 75% |
| Error Rate | < 2% | < 1% | < 0.5% |

### 4.3 Month 1 Success Metrics

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| Total Signups | 100 | 250 | 500 |
| DAU/MAU Ratio | 15% | 25% | 35% |
| First Paying Subscribers | 3 | 10 | 25 |
| MRR | $27 | $90 | $225 |

---

## Phase 5: Stripe Integration Details

### 5.1 Stripe Price IDs (Needed from CEO)

**Basic Tier ($9/mo)**
- Price ID: `price_XXXXXXXXXXXXXX`
- Product Name: "Priv8sus Basic"
- Interval: Monthly

**Pro Tier ($19/mo)**
- Price ID: `price_XXXXXXXXXXXXXX`
- Product Name: "Priv8sus Pro"
- Interval: Monthly

### 5.2 CTO Stripe Configuration Needed

```bash
# Required Environment Variables
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxxx

# Stripe API Endpoints to Implement
POST /api/create-checkout-session  # For upgrading
POST /api/webhook                   # Stripe webhooks
GET /api/subscription-status        # Check user's tier
```

### 5.3 Stripe Fallback Plan

**If Stripe is NOT ready by launch day:**

1. Launch as FREE only MVP
2. Display pricing page with "Coming Soon" badges
3. Collect emails for "notify me when premium launches"
4. Set target: Stripe activate within 7 days post-launch
5. First paying customer target: Day 14 post-launch

---

## Phase 6: Risk Mitigation

### 6.1 Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-------------|--------|------------|
| CTO ERROR state (recurring) | HIGH | CRITICAL | Board direct deployment intervention |
| Deployment delay | HIGH | CRITICAL | Escalate to board for immediate action |
| Stripe human action delay | MEDIUM | HIGH | Launch free tier, activate Stripe Day 7 |
| Low conversion | MEDIUM | HIGH | A/B test onboarding, focus on activation |
| Low signup rate | MEDIUM | HIGH | CMO amplifies marketing push |

### 6.2 Escalation Triggers

| If This Happens | Escalate To | Within |
|-----------------|-------------|--------|
| Deployment not complete by Day 3 | CEO | 1 hour |
| Error rate > 5% | CTO | 15 minutes |
| API down > 10 minutes | CTO | 5 minutes |
| Stripe not activated by Day 7 | CEO | 1 hour |
| Signups < 10 by Day 3 | CPO → CEO | 24 hours |

---

## Phase 7: Owner Assignment Matrix

| Task | Owner | Type |
|------|-------|------|
| Complete deployment (BETA-73) | CTO / Board | Agent |
| Verify MVP live | Tech Support | Agent |
| Marketing execution | CMO | Agent |
| User interview outreach | CEO | Human |
| Stripe dashboard setup (BETA-233) | CEO | Human |
| Product monitoring | CPO | Agent |
| Bug triage | CTO | Agent |
| Incident escalation | CPO | Agent |

---

## Appendix: Key Reference Documents

| Document | Purpose |
|----------|---------|
| POST_LAUNCH_RUNBOOK.md | Operational procedures post-launch |
| DEPLOY_RUNBOOK.md | Deployment and rollback procedures |
| ROADMAP_V2.md | 12-month product roadmap |
| BETA-225 | Stripe integration plan |
| BETA-233 | Stripe dashboard setup (blocked) |
| BETA-73 | Deploy MVP (blocked) |

---

## Sign-Off

| Role | Name | Date |
|------|------|------|
| CPO (Author) | Chief Product Officer | April 3, 2026 |
| CEO (Review) | Pending | Pending |
| CTO (Technical Review) | Pending | Pending |

**CPO Declaration:** This checklist represents the complete launch execution plan. MVP code is ready. Deployment is the critical path. Once BETA-73 is resolved, launch can proceed within 24 hours.

---

*Last heartbeat review: April 3, 2026*
*Next review: Upon deployment completion*
