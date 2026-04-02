# Monitoring and Alerting Runbook

## Current Logging Setup

**Location**: `api/src/utils/logging.ts` and `api/src/logging.ts`

**What's Captured**:
- Console-based logging (console.debug/info/warn/error)
- Timestamps in ISO format
- Log levels: debug, info, warn, error
- Configurable via `LOG_LEVEL` environment variable
- Structured metadata support via JSON

**What's NOT Captured**:
- No file-based log persistence
- No log aggregation service
- No external monitoring
- No alerting on errors

**Usage in Code**:
```typescript
import { logger } from './utils/logging.js';
logger.info('User login', { email: user.email });
logger.error('Payment failed', { error: err.message, customerId });
```

---

## Critical Failure Scenarios

### P0 - Critical (Revenue Impact)
1. **API server down** - No access to predictions, betting, user accounts
2. **Database connection failure** - All read/write operations fail
3. **Payment processing failure** - Stripe/webhook errors
4. **Authentication broken** - Users can't log in

### P1 - High (User Impact)
5. **High error rate (>5%)** - Multiple API errors affecting users
6. **Slow response time (>3s)** - Performance degradation
7. **Email service down** - Welcome sequences, notifications fail
8. **Frontend unavailable** - Users can't access the app

### P2 - Medium (Operations)
9. **Redis unavailable** - Caching/sessions fail (degraded mode)
10. **External API failures** - NBA/ESPN data unavailable
11. **Disk space low** - Database or logs filling disk

---

## Alerting Configuration

### Railway Built-in Monitoring
Railway provides basic health monitoring and log aggregation:
- **Health endpoint**: `GET /api/health`
- **Railway logs**: `railway logs` CLI command
- **Deployment alerts**: Railway dashboard notifications

### Uptime Monitoring (Free Options)

#### Option 1: UptimeRobot (Recommended - Free)
1. Sign up at uptimerobot.com
2. Add monitor for:
   - `https://<railway-url>.railway.app/api/health`
   - `https://<vercel-url>` (frontend)
3. Set check interval: 5 minutes (free tier)
4. Configure alert notifications:
   - Email to tech support
   - Discord webhook (if available)

#### Option 2: Grafana Cloud Free Tier
1. Sign up at grafana.com/grafana/cloud
2. Create uptime check via Grafana Incident
3. Set up alerting rules
4. Dashboard for visualization

#### Option 3: Pingdom (Paid)
- More features but costs money
- Good for production-grade monitoring

### Alert Notification Channels
- **Email**: techsupport@priv8sus.com (configure when available)
- **Discord**: If Discord is set up, create a #alerts channel
- **PagerDuty**: For critical alerts requiring immediate response (paid)

---

## Alert Response Runbook

### T1: API Server Down
1. Check Railway dashboard for deployment status
2. Check Railway logs: `railway logs`
3. Verify environment variables are set
4. Check Railway status page
5. If needed, rollback to previous deployment
6. Escalate to CTO if not resolved in 10 minutes

### T2: High Error Rate
1. SSH to Railway container or check logs
2. Identify error patterns in logs
3. Check for:
   - Database connectivity issues
   - External API failures
   - Code bugs in recent deployments
4. Rollback if deployment-related
5. Create incident ticket

### T3: Database Issues
1. Check PostgreSQL status in Railway dashboard
2. Verify DATABASE_URL environment variable
3. Check connection pool limits
4. Escalate to CTO for database admin

### T4: Email Service Down
1. Check Resend API status
2. Verify RESEND_API_KEY is set in Railway
3. Check email logs for failures
4. Disable email sending if critical (to prevent queue buildup)

### T5: Performance Degradation
1. Check Railway metrics dashboard
2. Review slow query logs
3. Check for memory/CPU issues
4. Consider scaling up Railway plan

---

## Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API Health | `/api/health` | `{"status":"ok","timestamp":"..."}` |
| Database | `/api/health/db` | `{"db":"ok"}` (if implemented) |
| Redis | `/api/health/redis` | `{"redis":"ok"}` (if implemented) |

---

## Quick Commands

```bash
# Check Railway logs
railway logs

# Check Railway status
railway status

# Redeploy
railway up --detach

# Rollback to previous deployment
# (via Railway dashboard)

# Check API health
curl https://<railway-url>.railway.app/api/health
```

---

## Monitoring Checklist

- [ ] Set up UptimeRobot monitoring for API endpoint
- [ ] Set up UptimeRobot monitoring for frontend
- [ ] Configure alert email notifications
- [ ] Document on-call rotation (future)
- [ ] Set up log aggregation (future - Grafana/Loki)
- [ ] Implement structured error tracking (Sentry - BETA-166)
