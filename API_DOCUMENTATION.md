# Priv8Sus API Documentation

## Overview

Priv8Sus is a sports betting prediction platform that provides player stat predictions, best bets recommendations, and paper trading capabilities. The API supports:

- **Predictions**: AI-generated player stat predictions (points, rebounds, assists, etc.)
- **Best Bets**: High-confidence predictions with positive expected edge
- **Paper Trading**: Simulated betting to test strategies without real money
- **Subscriptions**: Free and Premium tiers with different feature access

## User Workflows

### New User Journey
1. `POST /api/auth/signup` - Create account
2. `POST /api/auth/login` - Get authentication token
3. `GET /api/predictions` - View today's predictions
4. `GET /api/best-bets` - View high-confidence bets
5. `POST /api/paper-trading/init` - Start paper trading

### Daily User Workflow
1. `GET /api/predictions?date=YYYY-MM-DD` - Get predictions for a game date
2. `GET /api/players/:id/betting-lines` - View betting lines for a specific player
3. `POST /api/paper-trading/bets` - Place a paper bet
4. `GET /api/paper-trading/bankroll` - Track performance

## Base URL
```
Production: https://priv8sus-api.up.railway.app/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/auth/login` and expire after 7 days.

---

## Public Endpoints

### Health & Monitoring

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-02T15:00:00.000Z"
}
```

#### `GET /api/monitoring/errors`
Get recent errors.

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of errors to return

**Response:**
```json
{
  "errors": [...],
  "count": 10
}
```

#### `GET /api/monitoring/error-stats`
Get error statistics.

**Response:**
```json
{
  "last24h": 5,
  "last1h": 0,
  "timestamp": "2026-04-02T15:00:00.000Z",
  "healthy": true
}
```

#### `POST /api/monitoring/errors/clear`
Clear error logs (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Error logs cleared"
}
```

---

### Email

#### `GET /api/email/track/:trackingId`
Track email open (1x1 transparent GIF). Returns a base64 GIF.

#### `POST /api/email/unsubscribe`
Unsubscribe user from emails.

**Request Body:**
```json
{
  "userId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

#### `GET /api/email/unsubscribe?uid=<userId>`
Unsubscribe via GET redirect.

**Query Parameters:**
- `uid` - User ID

**Response:** Redirects to `/?unsubscribe=success` or `/?unsubscribe=error`

#### `POST /api/subscribe`
Subscribe to newsletter.

**Request Body:**
```json
{
  "email": "user@example.com",
  "source": "website"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully subscribed to daily predictions",
  "subscriberId": 1
}
```

**Error Responses:**
- `400` - Invalid email format
- `409` - Email already subscribed

---

### Authentication

#### `POST /api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- Email must be valid format
- Password must be at least 8 characters

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing fields or invalid format
- `409` - Email already registered

#### `POST /api/auth/login`
Login to existing account.

**Request Body:**
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
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "onboardingCompleted": false,
    "isFirstLogin": true
  }
}
```

**Error Responses:**
- `400` - Missing fields
- `401` - Invalid credentials

---

### Predictions

#### `GET /api/predictions`
Get predictions for a given date.

**Query Parameters:**
- `date` (optional, default: today) - Date in YYYY-MM-DD format

**Response:**
```json
{
  "gameDate": "2026-04-02",
  "games": [
    {
      "id": 12345,
      "homeTeam": "Los Angeles Lakers",
      "homeAbbr": "LAL",
      "visitorTeam": "Boston Celtics",
      "visitorAbbr": "BOS",
      "homeScore": null,
      "visitorScore": null,
      "status": "scheduled"
    }
  ],
  "predictions": [...],
  "topPlayers": [
    {
      "playerId": 123,
      "playerName": "LeBron James",
      "teamAbbrev": "LAL",
      "position": "F",
      "predictedPts": 25.5,
      "predictedReb": 7.2,
      "predictedAst": 8.1,
      "confidence": 0.85,
      "bestBets": [
        {
          "statType": "pts",
          "lineValue": 24.5,
          "recommendation": "over",
          "overProb": 0.58,
          "underProb": 0.42,
          "edge": 0.18
        }
      ]
    }
  ],
  "totalPlayers": 120,
  "totalWithStats": 80
}
```

#### `GET /api/predictions/:id/result`
Get result for a specific prediction.

**Response:**
```json
{
  "id": 1,
  "player_id": 123,
  "player_name": "LeBron James",
  "team": "LAL",
  "position": "F",
  "game_date": "2026-04-02",
  "predicted": {
    "pts": 25.5,
    "reb": 7.2,
    "ast": 8.1,
    "stl": 1.2,
    "blk": 0.5,
    "threes": 2.8
  },
  "actual": {
    "pts": 28,
    "reb": 8,
    "ast": 7,
    "stl": 1,
    "blk": 0,
    "threes": 3
  },
  "accuracy_score": 0.85,
  "confidence": 0.85,
  "has_actual_results": true
}
```

#### `GET /api/history`
Get prediction history.

**Response:** Array of prediction objects (max 200, ordered by date descending)

#### `GET /api/predictions/score/:game_id`
Get scoring results for predictions on a game date.

**Query Parameters:**
- `threshold` (optional, default: 0.1) - Calibration threshold

**Response:**
```json
{
  "game_date": "2026-04-02",
  "total_predictions": 50,
  "predictions_with_results": 45,
  "threshold_used": 0.1,
  "by_stat": {
    "pts": { "mae": 3.2, "calibration_within_10pct": 0.72, "prediction_count": 45 },
    "reb": { "mae": 1.8, "calibration_within_10pct": 0.68, "prediction_count": 44 },
    "ast": { "mae": 2.1, "calibration_within_10pct": 0.65, "prediction_count": 43 }
  },
  "overall": {
    "avg_mae": 2.4,
    "avg_calibration": 0.68,
    "accuracy_score": 0.88
  }
}
```

#### `GET /api/accuracy`
Get accuracy stats by date.

**Response:**
```json
[
  {
    "game_date": "2026-04-01",
    "total_predictions": 50,
    "avg_confidence": 0.78
  }
]
```

---

### Players

#### `GET /api/players/search`
Search for players.

**Query Parameters:**
- `q` (required) - Search query (minimum 2 characters)

**Response:**
```json
[
  {
    "id": 123,
    "first_name": "LeBron",
    "last_name": "James",
    "team_abbreviation": "LAL",
    "position": "F"
  }
]
```

#### `GET /api/players/:id/betting-lines`
Get betting lines for a player.

**Query Parameters:**
- `date` (optional, default: today) - Game date

**Response:**
```json
{
  "playerId": 123,
  "playerName": "LeBron James",
  "team": "LAL",
  "position": "F",
  "gameDate": "2026-04-02",
  "distributions": {
    "pts": { "mean": 25.5, "std": 4.2, ... },
    "reb": { "mean": 7.2, "std": 1.8, ... }
  },
  "confidence": 0.85,
  "bettingLines": [
    {
      "statType": "pts",
      "line": 24.5,
      "overProb": 0.58,
      "underProb": 0.42,
      "edge": 0.18,
      "recommendation": "over",
      "kellyStake": 450
    }
  ],
  "bestBets": [...]
}
```

---

### Best Bets

#### `GET /api/best-bets`
Get best bets for a date (high confidence predictions with positive edge).

**Query Parameters:**
- `date` (optional, default: today) - Game date
- `minEdge` (optional, default: 0.15) - Minimum edge threshold

**Response:**
```json
{
  "gameDate": "2026-04-02",
  "totalGames": 5,
  "totalPlayersAnalyzed": 80,
  "bestBets": [
    {
      "playerId": 123,
      "playerName": "LeBron James",
      "team": "LAL",
      "position": "F",
      "statType": "pts",
      "lineValue": 24.5,
      "recommendation": "over",
      "overProb": 0.58,
      "underProb": 0.42,
      "edge": 0.18,
      "confidence": 0.85
    }
  ]
}
```

---

## Protected Endpoints (Require Authentication)

### User Profile

#### `GET /api/auth/me`
Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscriptionTier": "free",
    "createdAt": "2026-04-01T00:00:00.000Z",
    "onboardingCompleted": false,
    "firstLoginAt": "2026-04-01T12:00:00.000Z",
    "tourCompleted": false
  }
}
```

#### `PUT /api/auth/profile`
Update user profile.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated",
  "user": {
    "id": 1,
    "email": "newemail@example.com",
    "subscriptionTier": "free",
    "createdAt": "2026-04-01T00:00:00.000Z"
  }
}
```

#### `POST /api/auth/onboarding-complete`
Mark onboarding as complete.

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed"
}
```

#### `POST /api/auth/tour-complete`
Mark product tour as complete.

**Response:**
```json
{
  "success": true,
  "message": "Tour completed"
}
```

---

### Subscription

#### `GET /api/subscription`
Get current user's subscription info.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "tier": "free",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": null,
    "isActive": false,
    "tiers": {
      "free": {
        "name": "Free",
        "price": 0,
        "features": ["Daily email predictions", "Paper trading", "Basic predictions"]
      },
      "premium": {
        "name": "Premium",
        "price": 29,
        "features": ["Everything in Free", "Real-time predictions", "Advanced analytics", "Priority support"]
      }
    }
  }
}
```

#### `POST /api/subscription/checkout`
Create Stripe checkout session for premium upgrade.

**Request Body:**
```json
{
  "priceId": "price_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

---

### Analytics

#### `GET /api/analytics/daily-active-users`
Get daily active users count.

**Query Parameters:**
- `date` (optional, default: today) - Date in YYYY-MM-DD format

**Response:**
```json
{
  "date": "2026-04-02",
  "daily_active_users": 42
}
```

#### `GET /api/analytics/signups`
Get signup count since a date.

**Query Parameters:**
- `since` (optional, default: 30 days ago) - ISO date string

**Response:**
```json
{
  "since": "2026-03-03",
  "signups": 156
}
```

#### `GET /api/analytics/retention`
Get user retention stats.

**Query Parameters:**
- `day` (required) - 1, 7, or 30

**Response:**
```json
{
  "day": 7,
  "retained": 89,
  "total": 156,
  "rate": 0.57
}
```

#### `GET /api/analytics/paper-trades`
Get paper trades count.

**Query Parameters:**
- `since` (optional) - Filter by date

**Response:**
```json
{
  "since": "all",
  "paper_trades": 1234
}
```

#### `POST /api/analytics/track`
Track a user event.

**Request Body:**
```json
{
  "event_type": "prediction_viewed",
  "metadata": { "prediction_id": 123 }
}
```

**Valid event types:**
- `user_signup`
- `user_login`
- `prediction_viewed`
- `paper_trade_placed`
- `premium_upgrade`
- `premium_cancelled`

---

### Streaks

#### `GET /api/streaks`
Get user's streak information.

**Response:**
```json
{
  "success": true,
  "streak": {
    "current": 5,
    "longest": 12,
    "lastActivity": "2026-04-01"
  }
}
```

#### `POST /api/streaks/record`
Record a streak activity.

**Request Body:**
```json
{
  "activityType": "prediction_view"
}
```

**Response:** Same as `GET /api/streaks`

---

### Favorite Teams

#### `GET /api/favorite-teams`
Get user's favorite teams.

**Response:**
```json
{
  "success": true,
  "teams": ["LAL", "BOS", "GSW"]
}
```

#### `POST /api/favorite-teams`
Add a favorite team.

**Request Body:**
```json
{
  "teamAbbreviation": "LAL"
}
```

**Response:** Same as `GET /api/favorite-teams`

#### `DELETE /api/favorite-teams/:team`
Remove a favorite team.

**Response:** Same as `GET /api/favorite-teams`

---

## Paper Trading Endpoints

### `POST /api/paper-trading/init`
Initialize paper trading account.

**Request Body:**
```json
{
  "startBalance": 10000
}
```

**Response:**
```json
{
  "success": true,
  "bankroll": {
    "balance": 10000,
    "totalStaked": 0,
    "totalWon": 0,
    "totalLost": 0
  }
}
```

### `GET /api/paper-trading/bankroll`
Get current bankroll.

**Response:**
```json
{
  "balance": 9875.50,
  "totalStaked": 5000,
  "totalWon": 5250,
  "totalLost": 5374.50
}
```

### `GET /api/paper-trading/stats`
Get overall paper trading stats.

**Response:**
```json
{
  "totalBets": 45,
  "wonBets": 28,
  "lostBets": 17,
  "pendingBets": 3,
  "winRate": 0.622
}
```

### `GET /api/paper-trading/bets/open`
Get open (unsettled) bets.

**Response:**
```json
[
  {
    "id": 1,
    "playerId": 123,
    "playerName": "LeBron James",
    "teamAbbrev": "LAL",
    "gameDate": "2026-04-02",
    "statType": "pts",
    "line": 24.5,
    "overOrUnder": "over",
    "odds": -110,
    "stake": 100,
    "edge": 0.18,
    "probability": 0.58,
    "placedAt": "2026-04-02T10:00:00.000Z"
  }
]
```

### `GET /api/paper-trading/bets/history`
Get bet history.

**Query Parameters:**
- `limit` (optional, default: 50) - Maximum number of bets

**Response:** Array of settled bets

### `POST /api/paper-trading/bets`
Place a paper bet.

**Request Body:**
```json
{
  "playerId": 123,
  "playerName": "LeBron James",
  "teamAbbrev": "LAL",
  "gameDate": "2026-04-02",
  "statType": "pts",
  "line": 24.5,
  "overOrUnder": "over",
  "odds": -110,
  "stake": 100,
  "edge": 0.18,
  "probability": 0.58
}
```

**Response (201):**
```json
{
  "success": true,
  "bet": { ... }
}
```

### `POST /api/paper-trading/kelly`
Calculate Kelly criterion for a bet.

**Request Body:**
```json
{
  "probability": 0.58,
  "odds": -110,
  "divisor": 2
}
```

**Response:**
```json
{
  "kellyFraction": 0.145,
  "stake": 145,
  "expectedValue": 8.7,
  "americanOdds": -11000
}
```

### `POST /api/paper-trading/settle`
Settle a paper bet.

**Request Body:**
```json
{
  "betId": 1,
  "actualValue": 28
}
```

**Response:**
```json
{
  "success": true,
  "bet": {
    "id": 1,
    "status": "won",
    "profit": 90.91
  }
}
```

### `POST /api/paper-trading/reset`
Reset paper trading (delete all bets, reset bankroll).

**Response:**
```json
{
  "success": true,
  "bankroll": { ... }
}
```

### `POST /api/paper-trading/simulate`
Automatically place best bets for a date.

**Request Body:**
```json
{
  "date": "2026-04-02",
  "minConfidence": 0.7,
  "minEdge": 0.15,
  "maxBets": 10
}
```

**Response:**
```json
{
  "gameDate": "2026-04-02",
  "betsPlaced": 8,
  "totalStake": 1245.50,
  "bets": [...]
}
```

---

## Webhook Endpoints

### `POST /api/webhooks/stripe`
Stripe webhook for subscription events.

**Headers:**
- `stripe-signature` - Webhook signature

**Events Handled:**
- `checkout.session.completed` - Upgrade to premium
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_failed` - Payment failed

**Retry Policy:**
Stripe retries failed webhook deliveries with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 5 minutes
- Attempt 3: 30 minutes
- Attempt 4: 2 hours
- Attempt 5: 5 hours

If all retries fail, the event is marked as failed in Stripe dashboard.

---

## Pagination

List endpoints that return arrays support pagination via query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 50 | Number of items per page (max: 200) |
| `offset` | 0 | Number of items to skip |

**Paginated Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Product Error Codes

In addition to HTTP status codes, the API returns product-specific error codes:

| Code | Description |
|------|-------------|
| `PREDICTION_NOT_FOUND` | Requested prediction does not exist |
| `PLAYER_NOT_FOUND` | Player ID not found in database |
| `GAME_NOT_FOUND` | Game ID not found |
| `INSUFFICIENT_BALANCE` | Paper trading balance too low |
| `BET_ALREADY_SETTLED` | Cannot modify settled bet |
| `SUBSCRIPTION_REQUIRED` | Feature requires premium subscription |
| `STRIPE_ERROR` | Payment processing failed |
| `INVALID_DATE_RANGE` | Date parameter out of acceptable range |
| `VALIDATION_ERROR` | Request body failed validation |

**Error Response Format:**
```json
{
  "error": "PREDICTION_NOT_FOUND",
  "message": "Prediction with ID 123 not found",
  "code": "PREDICTION_NOT_FOUND"
}
```

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message",
  "message": "Detailed message (optional)"
}
```

**Common HTTP Status Codes:**
- `400` - Bad request / validation error
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Resource not found
- `409` - Conflict (e.g., email already exists)
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Rate Limits

- **Global:** 100 requests per 15 minutes
- **Auth endpoints:** 10 requests per 15 minutes

Rate limit responses return `429` with:
```json
{
  "error": "Too many requests, please try again later."
}
```
