# Production Monitoring Setup

## Overview

This document covers the monitoring setup for Priv8sus MVP production deployment.

---

## 1. Uptime Monitoring (Free Services)

### UptimeRobot (Recommended Free Tier)

1. **Sign up**: https://uptimerobot.com
2. **Add monitors**:
   - API: `https://<railway-url>.up.railway.app/api/health`
   - Frontend: `https://<vercel-url>.vercel.app`
3. **Check interval**: 5 minutes (free tier)
4. **Alert notifications**:
   - Email: configure when domain is ready
   - Discord webhook: `#alerts` channel

### Freshping (Free)

1. **Sign up**: https://www.freshping.io
2. Add same monitors as UptimeRobot
3. 5-minute check interval on free tier

### Grafana Cloud Free

1. **Sign up**: https://grafana.com/grafana/cloud
2. Create uptime check via Grafana Incident
3. Set alerting rules for 5xx errors

---

## 2. Error Rate Alerts for 5xx

### Railway Alerts

Railway provides deployment notifications but not detailed error rate alerts by default.

**Setup error rate monitoring**:

1. **Check Railway logs**:
   ```bash
   railway logs --tail 100 | grep "500\|502\|503\|504"
   ```

2. **Create alert on Railway dashboard**:
   - Go to Railway project → Settings → Alerts
   - Set alert for deployment failures

### API Error Tracking

**Health endpoint returns error count**:
```
GET /api/health
Response: {"status":"ok","timestamp":"...","errors":0}
```

**5xx error logging in `api/src/utils/logging.ts`**:
- All 5xx responses are logged with `logger.error()`
- Include request ID for tracing

### Recommended: Sentry Integration (BETA-166)

Sentry provides real-time error tracking:
- Captures stack traces
- Groups similar errors
- Alerts on error rate thresholds
- Free tier: 5k events/month

**Setup when deployed**:
```bash
npm install @sentry/node
```

---

## 3. Incident Response Checklist

### T1: API Server Down (P0)

- [ ] Check Railway dashboard deployment status
- [ ] Run `railway logs` to see errors
- [ ] Verify all env vars are set in Railway dashboard
- [ ] Check Railway status page: https://railway.status.com
- [ ] If deployment issue: rollback via Railway dashboard
- [ ] **Escalate to CTO if not resolved in 10 minutes**

### T2: High Error Rate >5% (P1)

- [ ] Check Railway logs for error patterns
- [ ] Identify root cause:
  - Database connectivity?
  - External API failures?
  - Code bugs?
- [ ] Rollback if deployment-related
- [ ] Create incident ticket
- [ ] Notify affected users

### T3: Database Issues (P1)

- [ ] Check PostgreSQL status in Railway dashboard
- [ ] Verify DATABASE_URL env var
- [ ] Check connection pool limits
- [ ] **Escalate to CTO for database admin**

### T4: Frontend Down (P1)

- [ ] Check Vercel dashboard
- [ ] Verify VITE_API_URL is set correctly
- [ ] Check Vercel deployment logs
- [ ] Redeploy if needed

### T5: Performance Degradation (P2)

- [ ] Check Railway metrics dashboard
- [ ] Review slow query logs
- [ ] Check memory/CPU usage
- [ ] Consider scaling Railway plan

---

## 4. Escalation Contacts & Procedures

### Escalation Chain

| Level | Role | Contact | When to Escalate |
|-------|------|---------|------------------|
| L1 | Tech Support (Agent 84bfd6de) | Paperclip | Initial response, monitoring alerts |
| L2 | CTO (b5c953fd) | Paperclip | Infrastructure issues, database, deployment |
| L3 | CEO (c67f32d8) | Paperclip | Revenue impact, security, data breach |

### Escalation Criteria

**Escalate to CTO when**:
- Infrastructure failure lasting >10 minutes
- Database corruption or data loss
- Security vulnerability
- Deployment blocked for >30 minutes

**Escalate to CEO when**:
- Revenue impact (payments failing)
- User data breach
- Service down for >1 hour
- Media inquiry

### On-Call Rotation (Future)

Currently no formal on-call rotation. Establish after MVP launch:
- Tech Support primary
- CTO secondary
- Rotate weekly

---

## 5. Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API Health | `/api/health` | `{"status":"ok","timestamp":"..."}` |
| Database | `/api/health/db` | `{"db":"ok"}` |
| Redis | `/api/health/redis` | `{"redis":"ok"}` |

---

## 6. Quick Commands

```bash
# Check Railway logs
railway logs

# Check Railway status
railway status

# Redeploy
railway up --detach

# Check API health
curl https://<railway-url>.up.railway.app/api/health
```

---

## 7. Monitoring Setup Checklist

- [ ] Set up UptimeRobot account
- [ ] Add API health monitor
- [ ] Add frontend monitor
- [ ] Configure alert email notifications
- [ ] Set up Discord #alerts channel webhook
- [ ] Test alerting flow
- [ ] Document on-call rotation (post-launch)
- [ ] Implement Sentry for error tracking (BETA-166)
- [ ] Set up log aggregation (future - Grafana/Loki)

---

## References

- Detailed runbook: `MONITORING_RUNBOOK.md`
- Deployment guide: `docs/deployment-guide.md`
- Health endpoint: `api/src/index.ts` (search for `/api/health`)