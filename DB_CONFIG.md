# Database Configuration Document

**Project:** Priv8sus (Betting House MVP)
**Owner:** CTO
**Last Updated:** 2026-04-02

---

## Current State

### Development Environment
- **Database:** SQLite
- **Location:** `api/data/predictions.db`
- **Adapter:** `better-sqlite3`
- **Connection:** Via `DB_PATH` env var or default `api/data/predictions.db`

### Production Environment (docker-compose.prod.yml)
- **Database:** PostgreSQL 16-alpine
- **Connection String:** `postgresql://postgres:postgres@db:5432/priv8sus`
- **Host:** `db` (Docker service name)
- **Credentials:** postgres/postgres

---

## Schema

The database schema includes these tables:

| Table | Purpose |
|-------|---------|
| `players` | NBA player profiles |
| `season_stats` | Historical player statistics |
| `predictions` | AI predictions for player stats |
| `betting_lines` | Betting line data |
| `games` | NBA game data |
| `player_conditions` | Injury/condition tracking |
| `bankroll` | Paper trading bankroll |
| `paper_bets` | Paper betting history |
| `scoring_results` | Prediction accuracy metrics |
| `weekly_reports` | Weekly performance reports |
| `subscribers` | Email subscribers |
| `users` | User accounts with subscription tiers |
| `events` | Analytics events |
| `user_streaks` | User engagement tracking |
| `user_activity` | Daily activity logs |
| `favorite_teams` | User's favorite teams |
| `email_jobs` | Scheduled email jobs |
| `email_events` | Email tracking events |

---

## Critical Issue: SQLite vs PostgreSQL Mismatch

**Problem:** The production `docker-compose.prod.yml` configures PostgreSQL, but the application code (`api/src/db.ts`) only supports SQLite via `better-sqlite3`.

**Impact:** If deployed with the current configuration, the API will fail to connect to the database because:
1. The code uses `better-sqlite3` (SQLite driver)
2. PostgreSQL requires `pg` or `postgres.js` driver
3. No database abstraction layer exists

**Recommendation:** Choose one approach:

### Option A: Stay with SQLite (Simpler)
- Keep SQLite for production (works well for single-server deployment)
- Remove PostgreSQL from docker-compose.prod.yml
- Use volume mount for `api/data/` to persist across deployments

### Option B: Migrate to PostgreSQL (Scalable)
- Add `pg` or `postgres.js` dependency
- Add database abstraction (e.g., Knex, Prisma, or Drizzle)
- Migrate schema and data
- Update connection string in production env

---

## Production Environment Variables

Required for production deployment:

```bash
# Database (if using PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@db:5432/priv8sus

# Or for SQLite
DB_PATH=/app/data/predictions.db

# Authentication
JWT_SECRET=<secure-random-string>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# Redis
REDIS_URL=redis://redis:6379
```

---

## Health Check

The API health endpoint is at `GET /api/health` and verifies:
1. Database connectivity
2. NBA API connectivity

---

## Backup Strategy

For SQLite in production:
- WAL mode enabled (better concurrent reads)
- Regular backups recommended via `sqlite3 .backup` or volume snapshots

For PostgreSQL:
- Use `pg_dump` for backups
- Configure automated backup schedule
