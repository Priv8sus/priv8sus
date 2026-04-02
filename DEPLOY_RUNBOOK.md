# Priv8sus Deployment Runbook

## Overview

This runbook covers deployment and rollback procedures for the Priv8sus MVP.

**Architecture:**
- Railway: Backend API + PostgreSQL + Redis
- Vercel: React frontend
- GitHub: Code repository (github.com/Priv8sus/priv8sus)

---

## Pre-Deployment Checklist

- [ ] All tests passing locally (`npm test` in api/ and frontend/)
- [ ] `.env.production` configured with production values
- [ ] GitHub repo up to date (`git push origin main`)
- [ ] Railway account connected to GitHub
- [ ] Vercel account connected to GitHub

---

## Railway Deployment (Backend)

### Option A: Deploy via GitHub (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select `Priv8sus/priv8sus`
5. Railway auto-detects `docker-compose.prod.yml` and deploys all services

### Option B: Manual Railway CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd /Users/theo/projects/priv8sus
railway init

# Link to existing project
railway link <project-id>

# Deploy
railway up
```

### Configure Environment Variables on Railway

In Railway dashboard → project → Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `JWT_SECRET` | 64-char random string | Yes |
| `NODE_ENV` | `production` | Yes (auto) |
| `PORT` | `3000` | Yes (auto) |
| `DATABASE_URL` | Auto-provided by Railway | Yes (auto) |
| `REDIS_URL` | `redis://redis:6379` | Yes (auto) |
| `STRIPE_SECRET_KEY` | Leave empty for MVP | No |
| `STRIPE_WEBHOOK_SECRET` | Leave empty for MVP | No |
| `RESEND_API_KEY` | Leave empty for MVP | No |

### Verify Railway Deployment

```bash
curl https://<your-railway-url>.railway.app/api/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

---

## Vercel Deployment (Frontend)

### Deploy via GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import `Priv8sus/priv8sus`
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Configure Environment Variable

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway URL (e.g., `https://priv8sus.railway.app`) |

### Deploy

Click **Deploy** — Vercel auto-deploys on every GitHub push to `main`.

---

## Production Docker Compose (Self-Hosted)

For self-hosted production deployment:

```bash
cd /Users/theo/projects/priv8sus/infra/docker

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 80 | React app via nginx |
| api | 3000 | Node.js backend |
| db | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |

---

## Rollback Procedures

### Railway Rollback

1. Go to Railway dashboard → your deployment
2. Click **Deployments** tab
3. Find the last working deployment
4. Click **...** → **Redeploy**

### Vercel Rollback

1. Go to Vercel dashboard → your project
2. Click **Deployments** tab
3. Find the last working deployment
4. Click **...** → **Deploy**

### Docker Compose Rollback

```bash
cd /Users/theo/projects/priv8sus/infra/docker

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Restart previous version (if using git tags)
git checkout <previous-tag>
docker-compose -f docker-compose.prod.yml up -d
```

---

## Post-Deployment Verification

Run these checks after every deployment:

```bash
# 1. Check API health
curl https://<railway-url>/api/health

# 2. Check frontend loads
curl https://<vercel-url>

# 3. Check database connectivity
curl https://<railway-url>/api/predictions

# 4. Check Railway logs for errors
# (via Railway dashboard or CLI)
railway logs
```

---

## Infrastructure Notes (Post-MVP)

The following issues were identified during pre-launch infrastructure review and should be addressed after MVP launch:

### Redis (Configured but Not Used)
- Redis 7 is configured in `docker-compose.prod.yml` and `docker-compose.yml`
- Connection string: `redis://redis:6379`
- Healthcheck and persistence volume configured
- **Redis is NOT currently implemented in API code** — no client usage found
- Full documentation: [REDIS_CONFIG.md](./REDIS_CONFIG.md)
- Future use cases: caching, session storage, rate limiting, job queues

### SSL/TLS (Post-MVP)
- nginx.conf currently only listens on port 80 (HTTP)
- HTTPS requires: domain name, certificate provisioning (LetsEncrypt recommended)
- Update nginx.conf to redirect HTTP → HTTPS and configure SSL certificates

### Database Credentials (Before Production)
- docker-compose.prod.yml contains hardcoded `postgres:postgres` credentials
- **Change these before going live** — use strong, unique passwords
- Update `DATABASE_URL` and any hardcoded connection strings

### Rate Limiting (Post-MVP)
- No rate limiting currently configured in nginx.conf
- Consider adding limits (e.g., 100 requests/minute per IP) for abuse prevention

### Monitoring & Alerting (Post-MVP)
- No external monitoring stack deployed
- Consider: Prometheus + Grafana, DataDog, or cloud-native solutions

### Backups & Disaster Recovery (Post-MVP)
- No backup scripts or schedules exist in infra/
- Implement regular PostgreSQL backups (daily recommended)
- Document restore procedures and test restoration

---

## Common Issues

### API 502 Bad Gateway
- Check Railway logs: `railway logs`
- Verify `PORT` is set to `3000`
- Check health endpoint: `/api/health`

### Frontend CORS Errors
- Verify `VITE_API_URL` includes `https://`
- Check API is running and accessible

### Database Connection Failed
- Verify `DATABASE_URL` is set correctly on Railway
- Check PostgreSQL is healthy in Railway dashboard

### Build Failures
- Check `npm test` passes locally first
- Verify all dependencies in `package.json` are correct
- Check Railway build logs for details

---

## Emergency Contacts

- **CTO**: b5c953fd-d2d5-487a-998b-0edc53dd494f
- **Tech Support**: 84bfd6de-2e7d-4c6a-9956-bb35ca0c12d0

---

## Related Documentation

- [Deployment Guide](/BETA/issues/BETA-73) (BETA-73)
- [Infrastructure Checklist](/BETA/issues/BETA-88) (BETA-88)
- Full deployment guide: `/Users/theo/projects/priv8sus/docs/deployment-guide.md`
- Redis configuration: [REDIS_CONFIG.md](./REDIS_CONFIG.md)
