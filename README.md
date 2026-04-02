# Priv8sus - Sports Prediction App

AI-powered NBA player stats predictions with paper trading simulation.

## Services
- **api** - Backend API (Node.js/TypeScript/Express)
- **frontend** - React + Vite frontend
- **infra** - Docker & infrastructure configs
- **ml-pipeline** - Machine learning models & data processing

## Tech Stack
- **Backend**: TypeScript, Express, better-sqlite3, Zod, bcrypt, jsonwebtoken, stripe
- **Frontend**: React, TypeScript, Vite, PostHog analytics
- **Testing**: Jest with ts-jest
- **Deployment**: Docker, Railway (backend), Vercel (frontend)

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone and Install

```bash
git clone https://github.com/Priv8sus/priv8sus.git
cd priv8sus
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required for production
JWT_SECRET=your-secure-secret-here-min-32-chars

# Optional - for email functionality
RESEND_API_KEY=re_your_resend_key_here

# Optional - for Stripe payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# Optional - for NBA data API
BALLDONTLIE_API_KEY=your_api_key_here

# Defaults (no need to change for local dev)
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/predictions.db
LOG_LEVEL=info
CORS_ORIGIN=*
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend

```bash
cd api && npm run dev
```

API runs on `http://localhost:3000`

### 4. Start Frontend (separate terminal)

```bash
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Verify Setup

```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

## Environment Variables Reference

### Required for Production

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for JWT signing (min 32 chars, change from dev default) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe price ID for monthly subscription |
| `STRIPE_PRICE_ID_YEARLY` | Stripe Price ID for yearly subscription |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_PATH` | `./data/predictions.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for emails |
| `BALLDONTLIE_API_KEY` | none | API key for balldontlie.io |
| `RESEND_API_KEY` | none | API key for Resend email |

---

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

---

## Key Files

| File | Description |
|------|-------------|
| `api/src/index.ts` | Main Express server with all routes |
| `api/src/db.ts` | SQLite database initialization and schema |
| `api/src/predictions.ts` | Stats prediction logic |
| `api/src/probability-model.ts` | Probability distributions for betting lines |
| `api/src/paper-trading.ts` | Paper trading engine with Kelly criterion |
| `api/src/email-service.ts` | Email sending via Resend |
| `frontend/src/App.tsx` | Main React application |
| `frontend/src/context/AuthContext.tsx` | Authentication state management |

---

## Database

The SQLite database is stored at `data/predictions.db`. Key tables:
- `users` - User accounts with subscription tier
- `players` - NBA player data
- `season_stats` - Historical player statistics
- `predictions` - Generated predictions
- `paper_bets` - Paper trading bet history
- `bankroll` - Paper trading account balance

---

## Architecture

- **Backend**: Express server on port 3000 with SQLite database
- **Frontend**: Vite dev server on port 5173
- **Data**: NBA data from balldontlie.io API (free tier available)
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Payments**: Stripe integration for subscription management
