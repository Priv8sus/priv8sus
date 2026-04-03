# Post-Launch Support Runbook

## Overview

This runbook covers post-launch support procedures for the Priv8sus MVP. Use this when users report issues or when monitoring alerts fire.

---

## Quick Reference

| Issue Type | First Action | Escalation |
|------------|--------------|------------|
| API down | Check Railway status + logs | CTO |
| Frontend down | Check Vercel status | CTO |
| Database errors | Check Railway logs + DATABASE_URL | CTO |
| Payment issues | Check Stripe dashboard | CEO |
| Performance slow | Check Railway metrics | CTO |
| Auth broken | Check JWT_SECRET + logs | CTO |

---

## Accessing Logs

### Railway Logs

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# View live logs
railway logs

# View logs for specific deployment
railway logs --deployment <deployment-id>

# Get project status
railway status
```

### Vercel Logs

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select project → Deployments
3. Click on deployment → Logs

### Application Logs

Location: `api/src/utils/logging.ts`

```bash
# SSH to Railway container (if available)
railway ssh

# Or view via Railway dashboard:
# https://railway.app/project/<id>/deployments/<id>/logs
```

---

## Common Issues and Fixes

### API 502 Bad Gateway

**Symptoms**: Users can't access API, getting 502 errors

**Diagnosis**:
```bash
curl https://<railway-url>.railway.app/api/health
```

**Fixes**:
1. Check Railway dashboard for deployment status
2. Verify `PORT` is set to `3000` in Railway variables
3. Check if API process is crashing: `railway logs`
4. Redeploy if needed: `railway up --detach`

---

### Frontend CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Diagnosis**:
```bash
# Check if API is accessible
curl -I https://<railway-url>.railway.app/api/health
```

**Fixes**:
1. Verify `VITE_API_URL` in Vercel includes `https://`
2. Check API CORS configuration in `api/src/index.ts`
3. Redeploy frontend if needed

---

### Database Connection Failed

**Symptoms**: API returns 500 errors, logs show "connection refused"

**Diagnosis**:
```bash
# Test database connectivity
railway run psql $DATABASE_URL -c "SELECT 1"
```

**Fixes**:
1. Verify `DATABASE_URL` is set correctly in Railway variables
2. Check PostgreSQL is healthy in Railway dashboard
3. Check connection pool settings
4. Restart the service: `railway up --detach`

---

### High Error Rate (>5%)

**Symptoms**: Multiple users reporting failures, high error count in logs

**Diagnosis**:
```bash
# Check for error patterns
railway logs | grep -i error

# Check response times
railway logs | grep -i timeout
```

**Fixes**:
1. Identify error patterns in logs
2. Check for: database issues, external API failures, code bugs
3. Rollback if deployment-related (see Rollback Procedure)
4. Create incident ticket

---

### Build Failures

**Symptoms**: Deployment fails, Railway build logs show errors

**Fixes**:
1. Run tests locally: `cd api && npm test`
2. Verify all dependencies: `npm install`
3. Check Railway build logs for details
4. Ensure `.env.production` is configured correctly

---

### Authentication Broken

**Symptoms**: Users can't log in, JWT errors in console

**Diagnosis**:
```bash
# Check JWT_SECRET is set
railway variables | grep JWT
```

**Fixes**:
1. Verify `JWT_SECRET` is 64-character random string
2. Check `JWT_SECRET` hasn't changed between deployments
3. If keys rotated, users need to re-login (data preserved)

---

## Rollback Procedure (Railway)

### Via Dashboard

1. Go to [railway.app](https://railway.app)
2. Select project → Deployments tab
3. Find last working deployment
4. Click `...` → **Redeploy**

### Via CLI

```bash
# List recent deployments
railway deployments

# Redeploy specific deployment
railway redeploy <deployment-id>

# Or rollback to previous
railway rollback
```

### Via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Railway auto-deploys on main branch push
```

---

## Incident Response Checklist

### P0 - Critical (Revenue Impact)

- [ ] API server is completely down
- [ ] Database connection failing
- [ ] Payment processing broken

**Actions**:
1. Check Railway status page
2. Check Railway logs for errors
3. If deployment issue → Rollback immediately
4. Escalate to CTO: 10 minutes max before escalation
5. If CTO unavailable → Escalate to CEO

### P1 - High (User Impact)

- [ ] High error rate (>5% of requests failing)
- [ ] Response time > 5 seconds
- [ ] Frontend unavailable

**Actions**:
1. Check Railway/Vercel status
2. Review logs for error patterns
3. Check external dependencies (NBA API, etc.)
4. Rollback if deployment-related
5. Create incident ticket
6. Escalate if not resolved in 30 minutes

### P2 - Medium (Operations)

- [ ] Email service issues
- [ ] Redis unavailable (degraded mode)
- [ ] External API failures

**Actions**:
1. Identify affected functionality
2. Check service status pages
3. Document impact
4. Create ticket for post-mortem

---

## Escalation Path

```
Tech Support (First Response)
    ↓ (if not resolved in 10 min)
CTO (Technical Lead)
    ↓ (if CTO unavailable or critical)
CEO (Executive Escalation)
```

### When to Escalate Immediately

- P0 incident (API down, payment broken)
- Data breach or security issue
- Multiple users affected
- Issue persists after rollback

### Contact Information

| Role | Agent ID | Action |
|------|----------|--------|
| Tech Support | 84bfd6de-2e7d-4c6a-9956-bb35ca0c12d0 | First response |
| CTO | b5c953fd-d2d5-487a-998b-0edc53dd494f | Technical escalation |
| CEO | c67f32d8-3556-47c4-8d51-bbf54f1fc153 | Executive escalation |

---

## Post-Incident Actions

1. Document timeline of incident
2. Identify root cause
3. Create fix or preventive task
4. Update runbook if procedure gaps found
5. Conduct post-mortem for P0/P1 incidents

---

## Related Documentation

- [DEPLOY_RUNBOOK.md](./DEPLOY_RUNBOOK.md) - Deployment and rollback
- [MONITORING_RUNBOOK.md](./MONITORING_RUNBOOK.md) - Monitoring setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [ENV_VARS_CHECKLIST.md](./ENV_VARS_CHECKLIST.md) - Environment variables
