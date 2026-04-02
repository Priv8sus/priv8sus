# Environment Variables Checklist

**Project:** priv8sus
**Generated:** 2026-04-02
**Purpose:** Document all environment variables used in the project

---

## API Environment Variables (`api/src/env.ts`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | Environment: development, production, test |
| `BALLDONTLIE_API_KEY` | Optional | - | API key for balldontlie.ml NBA data |
| `ESPNNBAL_API_KEY` | Optional | - | ESPN NBA API key |
| `DATABASE_PATH` | No | `./data/predictions.db` | SQLite database path |
| `LOG_LEVEL` | No | `info` | Log level: debug, info, warn, error |
| `CORS_ORIGIN` | No | `*` | CORS allowed origin |
| `JWT_SECRET` | **Yes** | - | Secret for JWT token signing |
| `STRIPE_SECRET_KEY` | Optional | - | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Optional | - | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Optional | - | Stripe monthly subscription price ID |
| `STRIPE_PRICE_ID_YEARLY` | Optional | - | Stripe yearly subscription price ID |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for email links |

### Additional API Env Vars (from code search)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Optional | - | Email service (Resend) API key |
| `DB_PATH` | No | `./data/predictions.db` | Alternative database path (used in db.ts) |

---

## Frontend Environment Variables (`frontend/.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API server URL (default: http://localhost:3000) |
| `VITE_POSTHOG_KEY` | Optional | PostHog analytics key |
| `VITE_POSTHOG_HOST` | Optional | PostHog host URL |
| `VITE_SENTRY_DSN` | Optional | Sentry error tracking DSN |
| `VITE_SENTRY_ENV` | Optional | Sentry environment (e.g., production) |

---

## Root Project Environment Variables (`.env.example`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_PORT` | No | `3000` | API port |
| `DATABASE_URL` | No | `postgresql://localhost:5432/priv8sus` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | **Yes** | - | JWT secret |
| `VITE_API_URL` | No | `http://localhost:3000` | Frontend API URL |
| `VITE_POSTHOG_KEY` | Optional | - | PostHog key |
| `VITE_POSTHOG_HOST` | Optional | `https://app.posthog.com` | PostHog host |
| `MODEL_PATH` | No | `./models/` | ML model path |
| `DATA_PATH` | No | `./data/` | Data directory path |
| `RESEND_API_KEY` | Optional | - | Resend email API key |

---

## Production Environment Variables (`.env.production.example`)

**Note:** Production env vars should be configured via hosting platform (Railway/Vercel) secrets, not committed to repo.

---

## Status Summary

### ✅ Documented & Configured
- `PORT`, `NODE_ENV`, `DATABASE_PATH`, `LOG_LEVEL`, `CORS_ORIGIN`, `FRONTEND_URL`
- `VITE_SENTRY_DSN`, `VITE_SENTRY_ENV`

### ⚠️ Missing from .env.example (used in code but not documented)
- `RESEND_API_KEY` - used in `api/src/email-service.ts`
- `DB_PATH` - used in `api/src/db.ts`

### 🔴 Required but Not in .env.example
- `JWT_SECRET` - **required** by `api/src/env.ts` validation

### ✅ Optional/External Services
- `BALLDONTLIE_API_KEY` - NBA data API
- `ESPNNBAL_API_KEY` - ESPN API
- `STRIPE_*` - Payment processing
- `VITE_POSTHOG_KEY` - Analytics

---

## Recommendations

1. **Add `JWT_SECRET` to `.env.example`** - it's required but not documented
2. **Add `RESEND_API_KEY` to root `.env.example`** - currently only in root but not in API-specific template
3. **Consolidate env var documentation** - root `.env.example` and `api/src/env.ts` have slight mismatches

---

## Files Checked
- `/api/src/env.ts` - Zod schema validation
- `/api/src/email-service.ts` - Resend API usage
- `/api/src/db.ts` - Database path resolution
- `/api/src/index.ts` - Various env vars
- `/api/src/nba-api.ts` - API key usage
- `/api/src/logging.ts` - Log level
- `/.env.example` - Root example
- `/.env.production.example` - Production template
- `/frontend/.env.example` - Frontend template
