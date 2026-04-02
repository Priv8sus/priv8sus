# Email Capture & Referral System - Technical Specification

## Overview

Two critical GTM infrastructure pieces needed before community seeding can drive conversions.

---

## 1. Email Capture System

### Database Schema

```sql
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  referral_code TEXT,
  status TEXT DEFAULT 'active', -- active, unsubscribed
  source TEXT DEFAULT 'landing_page', -- landing_page, discord, reddit, twitter
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
```

### API Endpoints

#### POST /api/subscribe

Subscribe a new email to the daily picks list.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "landing_page"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully subscribed",
  "subscriberId": 1
}
```

**Response (400 - invalid email):**
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

**Response (409 - already subscribed):**
```json
{
  "success": false,
  "error": "Email already subscribed"
}
```

#### POST /api/unsubscribe

Unsubscribe an email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

#### GET /api/subscribers/count

Get subscriber count (for landing page display).

**Response (200):**
```json
{
  "count": 47,
  "timestamp": "2026-04-01T19:00:00Z"
}
```

---

## 2. User Authentication System

### Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  tier TEXT DEFAULT 'free', -- free, premium
  premium_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
```

### API Endpoints

#### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "referralCode": "ABC123"  // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "tier": "free",
    "referralCode": "XYZ789"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

#### POST /api/auth/login

Login to existing account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "tier": "free"
  }
}
```

---

## 3. Referral System

### Database Schema

```sql
CREATE TABLE referral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  owner_user_id INTEGER NOT NULL,
  uses INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE referral_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- referrer_premium, referee_premium
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Referral Code Logic

- Each user gets a unique 6-character referral code on signup
- Code format: uppercase alphanumeric (e.g., `ABC123`)
- When referral code is used during signup:
  - Referrer gets 3-day premium upgrade
  - Referee gets 3-day premium upgrade
- Maximum reward: 30 days premium per referrer (10 successful referrals)

### API Endpoints

#### POST /api/referral/generate

Get or create referral code for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "code": "ABC123",
  "url": "https://priv8sus.com/?ref=ABC123",
  "uses": 2
}
```

#### POST /api/referral/apply

Apply a referral code during signup (or linked to account).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "code": "ABC123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Referral code applied! 3-day premium activated.",
  "reward": "3-day premium"
}
```

**Response (400 - invalid code):**
```json
{
  "success": false,
  "error": "Invalid referral code"
}
```

**Response (409 - already used):**
```json
{
  "success": false,
  "error": "Referral code already used"
}
```

#### GET /api/referral/stats

Get referral stats for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "totalReferrals": 5,
  "totalRewardDays": 15,
  "remainingRewards": 15,
  "referralCode": "ABC123"
}
```

---

## 4. Landing Page Integration

### Frontend Changes Needed

1. Connect email form to `POST /api/subscribe`
2. Show subscriber count from `GET /api/subscribers/count`
3. Add "Already subscribed" state
4. Handle success/error states

### Sample Implementation

```typescript
// frontend/src/hooks/useEmailCapture.ts
async function captureEmail(email: string) {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source: 'landing_page' })
  });
  return res.json();
}
```

---

## 5. Email Delivery (Future)

For daily picks email, consider using:
- **Resend** - Simple API, good DX
- **SendGrid** - Robust, scalable
- **AWS SES** - Cost-effective at scale

### Daily Email Schema (Future)

```typescript
interface DailyPicksEmail {
  to: string;
  subject: string;
  picks: Array<{
    player: string;
    team: string;
    stat: string;
    line: number;
    confidence: number;
  }>;
  premiumPicks: Array<{...}>; // only for premium users
}
```

---

## Implementation Priority

| Component | Priority | Effort |
|-----------|----------|--------|
| Email capture API | High | 2 hours |
| Landing page integration | High | 1 hour |
| User auth (signup/login) | High | 4 hours |
| Referral system | Medium | 4 hours |
| Email delivery | Low | 8 hours |
