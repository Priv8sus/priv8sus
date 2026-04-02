# Priv8sus Architecture

## Overview

Priv8sus is a sports betting prediction platform that uses NBA data to generate predictions and track paper trading performance.

## Directory Structure

```
/Users/theo/projects/priv8sus/
├── api/                          # Backend API (Node.js/TypeScript)
│   ├── src/
│   │   ├── index.ts             # Main Express app - all routes defined here
│   │   ├── db.ts               # SQLite database schema & migrations
│   │   ├── env.ts              # Environment validation with Zod
│   │   ├── nba-api.ts          # BallDontLie API client
│   │   ├── espn-nba-api.ts     # ESPN API fallback client
│   │   ├── unified-nba-api.ts   # Unified NBA API with fallback logic
│   │   ├── predictions.ts       # Prediction generation logic
│   │   ├── probability-model.ts # Statistical distribution models
│   │   ├── paper-trading.ts    # Paper trading & Kelly criterion
│   │   ├── analytics.ts        # User analytics & streaks
│   │   ├── email-service.ts    # Resend email integration
│   │   ├── ingestion.ts        # NBA data ingestion
│   │   ├── player-condition.ts # Player injury/condition tracking
│   │   ├── error-tracking.ts   # Error monitoring
│   │   └── logging.ts          # Logging utility
│   └── data/                    # SQLite database file location
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Main app with routing logic
│   │   ├── main.tsx            # Entry point
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Authentication state management
│   │   └── components/
│   │       ├── LandingPage.tsx # Public landing page
│   │       ├── Login.tsx      # Login form
│   │       ├── Signup.tsx     # Signup form
│   │       ├── Dashboard.tsx  # Main dashboard
│   │       ├── TopPredictions.tsx
│   │       ├── PlayerDetailPanel.tsx
│   │       ├── AccuracyMetrics.tsx
│   │       ├── HistoricalView.tsx
│   │       ├── UserProfile.tsx
│   │       ├── TourGuide.tsx
│   │       └── WelcomeScreen.tsx
│   └── dist/                   # Built frontend output
│
├── ml-pipeline/                # Python ML training pipeline
│   ├── src/
│   │   ├── model.py           # ML model training
│   │   └── predict.py         # Prediction scripts
│   ├── models/                  # Trained model files
│   │   └── stat_models.pkl
│   └── data/                    # Training data
│
├── infra/                      # Infrastructure
│   └── docker/
│       ├── Dockerfile.api       # Node.js API container
│       ├── Dockerfile.frontend # nginx frontend container
│       ├── docker-compose.yml   # Local development
│       └── docker-compose.prod.yml # Production deployment
│
├── docs/                        # Documentation
├── docker-compose.yml           # Root compose (production)
├── .env                         # Environment variables
├── .env.example
└── .env.production.example
```

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/monitoring/errors` | No | Recent errors |
| GET | `/api/monitoring/error-stats` | No | Error statistics |
| POST | `/api/monitoring/errors/clear` | No | Clear error logs |

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| POST | `/api/auth/onboarding-complete` | Yes | Mark onboarding done |
| POST | `/api/auth/tour-complete` | Yes | Mark tour done |

### Subscriptions (`/api/subscription`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscription` | Yes | Get subscription info |
| POST | `/api/subscription/checkout` | Yes | Create Stripe checkout |

### Webhooks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/stripe` | No | Stripe webhook handler |

### Predictions (`/api/predictions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/predictions` | No | Get predictions for date |
| POST | `/api/predictions` | No | Create prediction |
| GET | `/api/predictions/:id/result` | No | Get prediction result |
| GET | `/api/predictions/score/:game_id` | No | Score predictions |

### Games & Players

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | No | Prediction history |
| GET | `/api/players/search` | No | Search players |
| GET | `/api/players/:id/betting-lines` | No | Get betting lines |
| GET | `/api/best-bets` | No | Get best bets |

### Paper Trading (`/api/paper-trading`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/paper-trading/init` | No | Initialize bankroll |
| GET | `/api/paper-trading/bankroll` | No | Get bankroll |
| GET | `/api/paper-trading/stats` | No | Get bet stats |
| GET | `/api/paper-trading/bets/open` | No | Get open bets |
| GET | `/api/paper-trading/bets/history` | No | Get bet history |
| POST | `/api/paper-trading/bets` | No | Place bet |
| POST | `/api/paper-trading/kelly` | No | Calculate Kelly criterion |
| POST | `/api/paper-trading/settle` | No | Settle bet |
| POST | `/api/paper-trading/reset` | No | Reset paper trading |
| POST | `/api/paper-trading/simulate` | No | Auto-simulate bets |

### Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/daily-active-users` | No | DAU count |
| GET | `/api/analytics/signups` | No | Signup count |
| GET | `/api/analytics/retention` | No | Retention stats |
| GET | `/api/analytics/paper-trades` | No | Paper trade count |
| GET | `/api/streaks` | Yes | User streak info |
| POST | `/api/streaks/record` | Yes | Record activity |
| GET | `/api/favorite-teams` | Yes | Get favorite teams |
| POST | `/api/favorite-teams` | Yes | Add favorite team |
| DELETE | `/api/favorite-teams/:team` | Yes | Remove favorite team |

### Email

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/email/track/:trackingId` | No | Email open tracking |
| POST | `/api/email/unsubscribe` | No | Unsubscribe |
| GET | `/api/email/unsubscribe` | No | Unsubscribe (redirect) |
| POST | `/api/digest/send` | No | Send daily digest |

### Ingestion

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ingest/today` | No | Ingest today's data |
| POST | `/api/ingest/players` | No | Ingest players |
| POST | `/api/ingest/stats` | No | Ingest historical stats |

## Database Schema (SQLite)

### Core Tables

- `players` - Player profiles (id, first_name, last_name, team_abbreviation, position)
- `season_stats` - Season average statistics per player
- `predictions` - Generated predictions with actual results for scoring
- `betting_lines` - Betting line probabilities
- `games` - NBA game data
- `player_conditions` - Player injury/rest information

### User Tables

- `users` - User accounts with auth fields and subscription tier
- `subscribers` - Newsletter subscribers

### Paper Trading Tables

- `bankroll` - Paper trading account balance
- `paper_bets` - Placed paper bets

### Analytics Tables

- `events` - User activity events
- `user_streaks` - Daily streak tracking
- `user_activity` - Activity log
- `favorite_teams` - User's favorite NBA teams

### Email Tables

- `email_jobs` - Scheduled email jobs
- `email_events` - Email open/click tracking

### Scoring Tables

- `scoring_results` - MAE/RMSE per game date
- `weekly_reports` - Aggregated weekly reports

## Authentication Flow

1. **Signup** (`POST /api/auth/signup`):
   - Email/password validation (min 8 char password)
   - Email normalized to lowercase
   - Password hashed with bcrypt (10 salt rounds)
   - JWT token generated (7 day expiry)
   - Welcome email queued via Resend
   - Day1/Day3 follow-up emails scheduled

2. **Login** (`POST /api/auth/login`):
   - Email/password validation
   - bcrypt password comparison
   - JWT token generated (7 day expiry)
   - `first_login_at` tracked

3. **Token Validation** (`authenticateToken` middleware):
   - Bearer token in Authorization header
   - JWT verified with secret
   - `userId` and `email` extracted and attached to request

4. **Profile/Onboarding**:
   - `onboarding_completed` flag
   - `tour_completed` flag
   - `first_login_at` timestamp

## External Services

### BallDontLie API (Primary)

- **File:** `api/src/nba-api.ts`
- **Endpoint:** `https://api.balldontlie.io/v1`
- **Endpoints used:** `/players`, `/games`, `/season_averages`
- **Auth:** Bearer token via `BALLDONTLIE_API_KEY` env var

### ESPN NBA API (Fallback)

- **File:** `api/src/espn-nba-api.ts`
- **Used when:** BallDontLie fails
- **Covers:** Games, roster, player stats

### Stripe (Payments)

- **Webhook handling:** `POST /api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`

### Resend (Email)

- **File:** `api/src/email-service.ts`
- **Email types:** Welcome, Day1, Day3, Daily Digest
- **Tracking:** Open tracking via pixel
- **Env vars:** `RESEND_API_KEY`

### Vercel (Frontend Hosting)

- **Config:** `frontend/vercel.json`
- **Rewrites:** `/api/*` → `https://priv8sus-api.up.railway.app/api/:splat`

## Required Environment Variables

### API (.env)

```
# API
API_PORT=3000
DATABASE_URL=postgresql://localhost:5432/priv8sus  # Production only
REDIS_URL=redis://localhost:6379                      # Production only
JWT_SECRET=your-secret-here
LOG_LEVEL=info

# Frontend
VITE_API_URL=http://localhost:3000

# NBA Data Sources
BALLDONTLIE_API_KEY=7ffec881-5f69-4f19-9867-3d6376f4b50b

# ML Pipeline
MODEL_PATH=./models/
DATA_PATH=./data/

# Email
RESEND_API_KEY=re_your_key_here

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
FRONTEND_URL=http://localhost:5173
```

## Frontend Routes

The frontend uses client-side routing with React state:

- `/` or `/landing` - Landing page with marketing content
- `/dashboard` - Main dashboard (requires auth)
  - Today's predictions view
  - Historical predictions view
  - Player detail panel
  - Accuracy metrics sidebar
- Auth modal overlays for Login/Signup

## Key Technologies

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8 |
| Backend | Express.js, Node.js |
| Database | SQLite (dev), PostgreSQL (prod) |
| Cache | Redis (prod) |
| Auth | JWT, bcrypt |
| Payments | Stripe |
| Email | Resend |
| NBA Data | BallDontLie API, ESPN API |
| ML | Python, scikit-learn |
| Container | Docker, nginx |
