# Redis Configuration

## Overview

Redis is configured in the production stack but is **not currently implemented** in the API code. It is provisioned for future caching and session management use cases.

## Connection Details

| Setting | Value |
|---------|-------|
| Host | `redis` (Docker service name) |
| Port | `6379` |
| Connection String | `redis://redis:6379` |
| Password | None (local Docker) |
| Database | `0` (default) |

## Docker Configuration

**Service:** `redis` in `infra/docker/docker-compose.prod.yml`

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## Environment Variable

```env
REDIS_URL=redis://redis:6379
```

Set in `docker-compose.prod.yml` for the `api` service.

## Persistence

- **Volume:** `redis_data:/data`
- **Location:** Docker named volume (persists across restarts)

## Health Check

```bash
redis-cli ping
# Expected response: PONG
```

## Current API Usage

**Status:** Not implemented

The API code does not currently import or use a Redis client. The `REDIS_URL` environment variable is set but no code consumes it.

### Files referencing Redis (documentation only):
- `infra/docker/docker-compose.prod.yml` - Docker service definition
- `docker-compose.yml` - Local development stack
- `DEPLOY_RUNBOOK.md` - Deployment documentation
- `ARCHITECTURE.md` - Architecture documentation
- `ENV_VARS_CHECKLIST.md` - Environment variable reference

## Production Readiness

| Check | Status | Notes |
|-------|--------|-------|
| Service configured | ✅ | Redis 7 Alpine image |
| Healthcheck | ✅ | redis-cli ping configured |
| Persistence | ✅ | Named volume configured |
| Network accessible | ✅ | Same Docker network as API |
| Used by API | ❌ | No client code implemented |

## Future Use Cases

When implementing Redis, potential use cases include:
- API response caching
- Session storage
- Rate limiting counters
- Job queue (Bull/BullMQ)
- Real-time pub/sub

## Troubleshooting

```bash
# Test Redis connectivity from API container
docker exec -it <api_container> redis-cli -h redis -p 6379 ping

# View Redis logs
docker logs <redis_container>

# Connect to Redis CLI locally
redis-cli -h localhost -p 6379
```
