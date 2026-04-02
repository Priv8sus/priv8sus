# Priv8sus Email Sequence

## Email 1: Day 0 — Welcome / Launch Announcement

**Subject:** Priv8sus is live — your predictions await
**Preview Text:** Your predictions. Your data. Your edge.

Hi [Name],

You've been waiting for something different in sports betting predictions.

**Priv8sus is now live.**

We built Priv8sus around one principle: your predictions should stay private. No data harvesting. No algorithmic manipulation. Just honest markets where your insights have real value.

**What this means for you:**
- Your prediction models stay yours
- Your betting data isn't sold to brokers
- You keep the edge you've worked to build

**Ready to join?**

👉 [Sign up at priv8sus.com](https://priv8sus.com)

Know someone who'd love privacy-first predictions? Share Priv8sus and we'll remember your referrals when we launch premium features.

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Email 2: Day 1 — Getting Started Guide

**Subject:** Your first prediction on Priv8sus — here's how to get started
**Preview Text:** Set up your account and make your first pick.

Hi [Name],

Welcome to Priv8sus. Here's how to start predicting:

**Step 1: Set up your profile**
Choose your sports, build your prediction models, and start making picks that are yours alone.

**Step 2: Explore NBA markets**
We're launching with NBA predictions. Moneyline, spreads, and parlays — all without your data being harvested.

**Step 3: Track your edge**
Use our dashboard to monitor your prediction performance. Your insights, your data, your results.

**Quick start guide:** [Link to getting started doc]

Questions? Reply to this email — we read every message.

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Email 3: Day 3 — Engagement / Value Reminder

**Subject:** Your predictions are waiting — don't let the edge slip away
**Preview Text:** See what you've missed in the last 48 hours.

Hi [Name],

The NBA season is heating up, and your predictions should be working for you — not against you.

**Did you know?**
On Priv8sus, your betting patterns stay private. While other platforms sell your insights to brokers, we keep your edge exactly where it belongs: with you.

**This week's top NBA matchups:**
- [Game 1] — Your prediction here
- [Game 2] — Your prediction here
- [Game 3] — Your prediction here

Log in and make your picks. Your data stays yours.

👉 [Sign in at priv8sus.com](https://priv8sus.com)

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Upgrade Email — Premium Conversion

**Subject:** Unlock your full edge with Priv8sus Premium
**Preview Text:** More predictions. More sports. More edge.

Hi [Name],

You've seen what Priv8sus can do with NBA predictions. Ready for more?

**Priv8sus Premium unlocks:**
- **All sports** — NBA, NFL, MLB, NHL, and more
- **Advanced models** — Deep learning prediction algorithms built by our quant team
- **Priority support** — Direct access to our data science team
- **Early access** — New features before public release
- ** Referral bonuses** — Earn credits when your network joins

**Launch pricing: [X]/month (50% off during launch week)**

Your predictions have value. Keep that edge for yourself.

👉 [Upgrade to Premium](https://priv8sus.com/premium)

Offer ends [Date].

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Email 4: Day 7 — Retention / Value Reinforcement

**Subject:** One week in — here's what your predictions are worth
**Preview Text:** You're building something valuable. Don't stop now.

Hi [Name],

A week ago you joined Priv8sus. Here's what that decision means:

**While other bettors feed algorithms** that sell their patterns back to the market, you've been building prediction models that stay 100% yours.

**Your edge compounds over time.** Every prediction you make teaches your model a little more about how you think. The longer you predict with Priv8sus, the sharper your edge becomes.

**This week's NBA highlight:** [Highlight a notable game/pick from the past week]

Stay consistent. Your predictions. Your edge. Your results.

👉 [Check your dashboard](https://priv8sus.com/dashboard)

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Email 5: Day 14 — Re-Engagement / "We Miss You"

**Subject:** Your predictions have been waiting — the NBA playoffs are close
**Preview Text:** It's been a minute. Here's what's been happening.

Hi [Name],

We noticed you haven't logged in for a bit. No pressure — life happens.

But the NBA playoffs are just around the corner, and your prediction models have been idle. Here's what's been happening on Priv8sus while you were away:

**New this week:**
- [Feature/update from the platform]
- Community picks from top predictors

**Your model is still here,** ready whenever you are. Your historical data, your settings, your edge — all preserved.

Ready to get back in the game?

👉 [Sign back in](https://priv8sus.com/login)

Still not ready? No unsubscribes here — we'll send you occasional updates when there are major NBA moments worth predicting.

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.

---

## Metrics Tracking

| Email | Send Day | Goal | Target Open Rate | Target Click Rate |
|-------|----------|------|------------------|-------------------|
| Welcome | Day 0 | Initial engagement | >40% | >15% |
| Getting Started | Day 1 | Account activation | >35% | >10% |
| Value Reminder | Day 3 | Re-engagement | >30% | >8% |
| Retention | Day 7 | Habit formation | >30% | >8% |
| Re-Engagement | Day 14 | Win-back dormant users | >25% | >5% |
| Premium Upgrade | Day 7+ | Conversion | >25% | >5% |

---

## Privacy-First Copy Guidelines

All emails must follow these principles:
- Never mention selling or sharing data
- Emphasize user ownership of predictions
- No algorithmic manipulation language
- Focus on the user's edge, not platform features
- Include clear unsubscribe option (standard compliance)
- Subject lines tested for inbox delivery

## Email Templates (Pending Implementation)

The email templates will be built in `frontend/src/emails/` once the authentication and email service infrastructure is complete. Each template will be a React component using a email styling library (e.g., React Email or MJML).

| Email | Template File | Status |
|-------|-------------|--------|
| Welcome / Launch | `welcome.tsx` | Pending |
| Getting Started | `getting-started.tsx` | Pending |
| Value Reminder | `value-reminder.tsx` | Pending |
| Retention | `retention.tsx` | Pending |
| Re-Engagement | `re-engagement.tsx` | Pending |
| Premium Upgrade | `premium-upgrade.tsx` | Pending |

**Template requirements:**
- Responsive HTML email (mobile-first)
- Consistent Priv8sus branding (logo, color palette, typography)
- Plain-text fallback versions
- UTM parameters on all CTA links for tracking
- Merge tags: `{{name}}`, `{{firstName}}`, `{{ctaUrl}}`, `{{unsubscribeUrl}}`

## Sending Schedule

Emails are triggered by user signup date (day 0 = signup date). The sending schedule is managed via the email service provider (e.g., SendGrid, Resend, or internal service):

| Day | Email | Trigger |
|-----|-------|---------|
| Day 0 | Welcome / Launch Announcement | Signup confirmed |
| Day 1 | Getting Started Guide | 24h after signup |
| Day 3 | Engagement / Value Reminder | 72h after signup |
| Day 7 | Retention / Value Reinforcement | 168h after signup |
| Day 7+ | Premium Upgrade (conditional) | If user has not upgraded, shown after Day 7 retention |
| Day 14 | Re-Engagement / "We Miss You" | 336h after signup if no login activity detected |
