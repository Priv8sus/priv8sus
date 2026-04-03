# Referral Program Specification — MVP Launch

**Owner:** CMO
**Status:** Ready for Execution
**Created:** 2026-04-03

---

## 1. Referral Incentive Structure

### Primary Offer: Free Pro Tier Access

| Role | Incentive | Duration | Conditions |
|------|-----------|----------|------------|
| Referrer | Pro tier upgrade | 14 days free | First 3 referrals |
| Referrer | Pro tier upgrade | 30 days max | Up to 10 referrals |
| Referee | Pro tier upgrade | 7 days free | On signup with code |

### Why Pro Tier?

- Pro tier is the gateway to premium features (advanced ML models, detailed analytics, exclusive NBA insights)
- 7-day trial is long enough to experience value, short enough to create urgency
- Referral converts who experiences Pro are highly likely to convert to paid

### Alternative Incentives (Future)

- Cash bounty per verified referral ($5-$10)
- Lifetime discount codes
- Exclusive community access

---

## 2. Referral Flow

### User Journey

```
[User A discovers Priv8sus]
        ↓
[Signs up for free tier]
        ↓
[Completes first prediction]
        ↓
[Sees "Refer Friends" prompt in dashboard]
        ↓
[Shares unique referral link/code]
        ↓
[User B clicks link → signs up]
        ↓
[Both users get Pro trial activated]
        ↓
[User A sees referral count in dashboard]
        ↓
[User B converts to paid OR churns]
        ↓
[User A encouraged to refer more]
```

### Technical Flow (from docs/email-referral-system.md)

- Each user gets a 6-character alphanumeric code on signup
- Code format: uppercase alphanumeric (e.g., `ABC123`)
- Referral URL: `https://priv8sus.com/?ref=ABC123`
- On referee signup with valid code:
  - Referrer awarded 3-day premium (accumulates up to 30 days max)
  - Referee awarded 3-day premium

### Dashboard UX

1. **Referral Widget** visible after first prediction
2. **Share Options:** Copy link, Twitter, Reddit, email
3. **Progress Tracker:** "Refer 3 friends for 2 weeks Pro"
4. **Referral Stats:** Count, days earned, remaining

---

## 3. Referral Email Templates

### Email 1: Initial Referral Invite (Day 0)

**Subject:** Your predictions are better shared — here's why
**Trigger:** User completes first prediction
**Send:** Immediately after first prediction

```
Hi [Name],

You just made your first prediction on Priv8sus. Nice.

Here's the thing: your prediction models get smarter over time. But the real edge comes when you validate them with others.

**Share Priv8sus with friends who get it about sports betting, and we'll give you both Pro access — free.**

Your referral code: [CODE]
Share link: [URL]

What you both get:
→ No data harvesting
→ Privacy-first predictions
→ Pro tier for [X] days

Share it how you want. The code works for anyone who signs up through your link.

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.
```

### Email 2: Reminder (Day 3)

**Subject:** Still thinking about it? Here's what you miss
**Trigger:** No referral completed by Day 3
**Target:** Re-engage

```
Hi [Name],

Quick follow-up on your Priv8sus referral:

You've got a code waiting: [CODE]
Share it → they get Pro. You get Pro.

No spam, no selling your data. Just predictions that stay yours.

[Share link]

—
*The Priv8sus Team*
```

### Email 3: Success Celebration (Day 1 post-referral)

**Subject:** Your friend joined — Pro access activated!
**Trigger:** Referral completes signup
**Send:** Immediately when referee converts

```
Hi [Name],

[Referee Name] just joined Priv8sus using your link.

Your Pro upgrade is now active. Check your dashboard for your new features.

They're getting the same 7-day Pro trial you got. Use it to explore the advanced ML models and NBA insights.

Keep sharing — you've got [X] more referrals until max out.

[Your dashboard]

—
*The Priv8sus Team*
Predict. Profit. Keep your secrets.
```

### Email 4: Referral Milestone (Day 7)

**Subject:** You've referred [X] friends — [Y] days of Pro unlocked
**Trigger:** Referral milestone reached
**Target:** Reinforce value, encourage more

```
Hi [Name],

You've referred [X] friends to Priv8sus. Here's what that means:

→ [Y] days of Pro unlocked
→ [Z] referrals until max (30 days)
→ Real edge compounding

Every friend who joins builds your prediction network. Keep going.

[Share link]

—
*The Priv8sus Team*
```

---

## 4. Week 1 Targets

### Primary Goal: 20 Referrals in 7 Days

| Metric | Target | Stretch |
|--------|--------|---------|
| Total referrals | 20 | 30 |
| Referral conversion rate | 15% | 25% |
| Referrals per day | 3-4 | 4-5 |
| Referral-to-paid conversion | 10% | 15% |

### Acquisition Channels

| Channel | Expected Share | Target Referrals |
|---------|---------------|------------------|
| Reddit (r/sportsbook) | 30% | 6 |
| Twitter/X | 20% | 4 |
| Direct link share | 25% | 5 |
| Discord | 15% | 3 |
| Email to existing contacts | 10% | 2 |

### Success Criteria

- Day 1: 3 referrals (launch momentum)
- Day 3: 10 referrals (mid-week push)
- Day 7: 20 referrals (full target)

### How to Hit 20 Referrals

1. **Day 0:** Post launch announcement on Reddit with referral CTA
2. **Day 1:** Email existing waitlist with referral codes
3. **Day 2-3:** Twitter thread emphasizing referral bonus
4. **Day 4-5:** DM Discord communities with referral link
5. **Day 6-7:** Push to any stragglers, milestone celebration

---

## 5. Implementation Checklist

- [ ] Referral codes generated on signup (technical)
- [ ] Referral widget added to dashboard (technical)
- [ ] Share links formatted correctly (technical)
- [ ] Email templates created in email system (technical)
- [ ] Referral tracking dashboard built (technical)
- [ ] Referral incentive copy finalized (marketing) ← **DONE**
- [ ] Week 1 referral targets set (marketing) ← **DONE**
- [ ] Email sequences drafted (marketing) ← **DONE**

---

## 6. First Paying Customer Criteria

A referral counts toward the 20-referral target when:

1. **Referee completes all of:**
   - Signs up using valid referral code
   - Verifies email
   - Makes first prediction

2. **Referrer reward triggers when:**
   - Referee meets above criteria
   - Referral is unique (new email, not existing user)

---

*Document: BETA-260*
*Owner: CMO*
