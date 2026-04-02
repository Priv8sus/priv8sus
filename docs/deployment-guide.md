# Production Deployment Guide

## Overview

This guide covers deploying the Priv8sus MVP to production using Railway (backend) and Vercel (frontend).

## Architecture

```
Internet → Railway (API + PostgreSQL + Redis)
                ↓
         Vercel (Frontend)
```

- **Railway**: Hosts the backend API, PostgreSQL database, and Redis cache
- **Vercel**: Hosts the React frontend
- **Cost**: ~$5-10/month for MVP

## Prerequisites

1. GitHub account with access to the Priv8sus organization
2. Railway account (sign up at railway.app)
3. Vercel account (sign up at vercel.com)

## Step 1: Create GitHub Repository

1. Go to https://github.com/Priv8sus
2. Click "New repository"
3. Name: `priv8sus`
4. Description: "Sports prediction market platform"
5. Select Public or Private as appropriate
6. **DO NOT** initialize with README
7. Note the repository URL

## Step 2: Initialize Git and Push Code

From the project root:

```bash
cd /Users/theo/projects/priv8sus

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: MVP codebase"

# Add remote (replace with actual URL)
git remote add origin git@github.com:Priv8sus/priv8sus.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy Backend to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `Priv8sus/priv8sus`
5. Railway will detect the `docker-compose.prod.yml` and deploy all services

### Configure Environment Variables

In Railway dashboard, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | Generate a random 64-char string | Required for auth |
| `NODE_ENV` | `production` | Auto-set |
| `PORT` | `3000` | Auto-set |
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/priv8sus` | Auto-set by Railway |
| `REDIS_URL` | `redis://redis:6379` | Auto-set by Railway |
| `STRIPE_SECRET_KEY` | (leave empty for MVP) | Optional |
| `STRIPE_WEBHOOK_SECRET` | (leave empty for MVP) | Optional |
| `RESEND_API_KEY` | (leave empty for MVP) | Optional |

### Note the Backend URL

After deployment, Railway will provide a URL like `priv8sus.railway.app`. Note this for the frontend configuration.

## Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import `Priv8sus/priv8sus`
5. Configure project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Configure Environment Variables

Add this environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL (e.g., `https://priv8sus.railway.app`) |

6. Click "Deploy"

## Step 5: Verify Deployment

1. Frontend should be accessible at `[vercel-project].vercel.app`
2. API should be accessible at `[railway-project].railway.app/api/health`
3. Test the health endpoint: `curl https://your-railway-url.railway.app/api/health`

## Custom Domain (Post-Launch)

### Register Domain

1. Register `priv8sus.com` via Namecheap, GoDaddy, or Cloudflare
2. Wait for DNS propagation

### Configure Railway Custom Domain

1. In Railway project → Settings → Domains
2. Add custom domain
3. Configure DNS records as instructed

### Configure Vercel Custom Domain

1. In Vercel project → Settings → Domains
2. Add custom domain
3. Configure DNS records as instructed

## Troubleshooting

### API Returns 502
- Check Railway logs for API service crashes
- Verify environment variables are set correctly
- Check health endpoint: `/api/health`

### Frontend Cannot Reach API
- Verify `VITE_API_URL` includes `https://`
- Check browser console for CORS errors
- Verify Railway health check is passing

### Database Connection Issues
- Check PostgreSQL health in Railway
- Verify `DATABASE_URL` format
- Check if PostgreSQL container is running

## Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] User signup/login works (if auth deployed)
- [ ] SSL certificate is active (auto-provisioned)
- [ ] Monitor Railway logs for errors

## Adding Stripe (Future)

When ready to add payments:

1. Create Stripe account at stripe.com
2. Create products in Stripe dashboard
3. Update environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID_MONTHLY`
   - `STRIPE_PRICE_ID_YEARLY`
4. Redeploy on Railway

## Cost Management

- Railway: ~$5-10/month for MVP (scales with usage)
- Vercel: Free for hobby tier
- Domain: ~$12/year
- Total: ~$60-132/year + hosting
