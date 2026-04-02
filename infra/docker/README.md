# Production Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Domain configured (or use default IP:port initially)
- All required secrets/keys obtained

## Quick Start

### 1. Prepare Environment

```bash
cp .env.production.example .env.production
# Edit .env.production with your values
```

### 2. Deploy

```bash
cd infra/docker
docker compose -f docker-compose.prod.yml up -d
```

### 3. Verify

```bash
# Check API health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost
```

## Deployment Platforms

### Railway (Recommended for MVP)

1. Create Railway account at railway.app
2. Connect your GitHub repository
3. Add environment variables from `.env.production`
4. Deploy services:
   - API: from `api/` with Dockerfile.api
   - Frontend: from `frontend/` with Dockerfile.frontend
   - PostgreSQL: use Railway's managed PostgreSQL
   - Redis: use Railway's managed Redis

### AWS (For production scale)

1. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name priv8sus-api
   aws ecr create-repository --repository-name priv8sus-frontend
   ```

2. Build and push images:
   ```bash
   # API
   docker build -f infra/docker/Dockerfile.api -t priv8sus-api:latest ../api
   docker tag priv8sus-api:latest <aws-account>.dkr.ecr.<region>.amazonaws.com/priv8sus-api:latest
   docker push <aws-account>.dkr.ecr.<region>.amazonaws.com/priv8sus-api:latest

   # Frontend
   docker build -f infra/docker/Dockerfile.frontend -t priv8sus-frontend:latest ../frontend
   docker tag priv8sus-frontend:latest <aws-account>.dkr.ecr.<region>.amazonaws.com/priv8sus-frontend:latest
   docker push <aws-account>.dkr.ecr.<region>.amazonaws.com/priv8sus-frontend:latest
   ```

3. Deploy to ECS/EKS using the images

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| JWT_SECRET | Yes | Secret for JWT signing (use random 256-bit value) |
| STRIPE_SECRET_KEY | No | For payment processing |
| STRIPE_WEBHOOK_SECRET | No | For Stripe webhooks |
| RESEND_API_KEY | No | For email sending |

## Ports

- 80: Frontend
- 3000: API
- 5432: PostgreSQL (internal)
- 6379: Redis (internal)