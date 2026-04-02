# Infrastructure Review Notes
**Review Date:** 2026-04-02
**Reviewer:** Tech Support Agent
**Task:** BETA-121

## Executive Summary
Infrastructure review completed for deployment prep. Multiple issues found that need attention before production deployment.

---

## Critical Issues

### 1. Database Configuration Mismatch (CRITICAL)
**File:** `infra/docker/docker-compose.prod.yml`
**Issue:** docker-compose sets `DATABASE_URL=postgresql://postgres:postgres@db:5432/priv8sus` but the API uses SQLite via `DB_PATH` environment variable.
**Evidence:**
- `api/src/db.ts:12` uses `process.env.DB_PATH || path.join(__dirname, "..", "data", "predictions.db")`
- `api/src/env.ts` schema has `DATABASE_PATH` not `DATABASE_URL`
- PostgreSQL credentials are hardcoded (see below)

**Impact:** The PostgreSQL database will be created but never used. API will default to SQLite database.

**Recommendation:** Either:
- Remove PostgreSQL service if SQLite is intended for MVP, OR
- Update API to use PostgreSQL with proper `DATABASE_URL` support

---

### 2. Hardcoded Database Credentials (HIGH)
**File:** `infra/docker/docker-compose.prod.yml`
**Lines:** 13, 48-49
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/priv8sus
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```
**Issue:** Database username and password are hardcoded in plaintext.

**Recommendation:** Move to environment variables:
```
DATABASE_URL=${DATABASE_URL}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

---

### 3. Default JWT Secret in Production (HIGH)
**File:** `api/src/env.ts:12`
```
JWT_SECRET: z.string().default('priv8sus-dev-secret-change-in-production'),
```
**Issue:** If `JWT_SECRET` is not set, a known default secret is used.

**Recommendation:** Make JWT_SECRET required in production, fail startup if not provided:
```typescript
JWT_SECRET: z.string().min(32), // Require strong secret in production
```

---

### 4. Permissive CORS Origin (MEDIUM)
**File:** `api/src/env.ts:11`
```
CORS_ORIGIN: z.string().default('*'),
```
**Issue:** Allows any origin by default.

**Recommendation:** Require explicit CORS_ORIGIN in production.

---

### 5. No HTTPS/SSL Configuration (HIGH)
**File:** `infra/docker/nginx.conf`
**Issue:** nginx only listens on port 80 (HTTP). No SSL/TLS configuration.

**Recommendation:** 
- Obtain SSL certificate (LetsEncrypt recommended for MVP)
- Add HTTPS listener on port 443
- Redirect HTTP to HTTPS

---

### 6. Frontend VITE_API_URL Hardcoded (MEDIUM)
**File:** `infra/docker/docker-compose.prod.yml:38`
```
VITE_API_URL: http://localhost:3000
```
**Issue:** Frontend API URL is hardcoded to localhost.

**Recommendation:** Make environment-based:
```
VITE_API_URL: ${FRONTEND_API_URL}
```

---

## Non-Critical Issues

### 7. No Rate Limiting
**File:** `infra/docker/nginx.conf`
**Issue:** No rate limiting configured.

**Recommendation:** Add nginx rate limiting directives.

### 8. No Monitoring/Alerting
**Issue:** No external monitoring stack deployed.

**Recommendation:** Consider adding Prometheus/Grafana or similar.

### 9. No Backup Procedures
**Issue:** No backup scripts or schedules for SQLite database.

**Recommendation:** Add cron job to backup `data/predictions.db`.

### 10. No Disaster Recovery Procedures
**Issue:** No DR documentation or tested restoration process.

---

## Files Reviewed
- `infra/docker/docker-compose.prod.yml`
- `infra/docker/nginx.conf`
- `api/src/env.ts`
- `api/src/db.ts`

---

## Summary Status

| Category | Status |
|----------|--------|
| Database Config | ❌ Mismatch - PostgreSQL unused |
| Credentials | ❌ Hardcoded |
| SSL/HTTPS | ❌ Missing |
| JWT Secret | ⚠️ Uses insecure default |
| CORS | ⚠️ Permissive default |
| Rate Limiting | ❌ Missing |
| Monitoring | ❌ Missing |
| Backups | ❌ Missing |
| DR Procedures | ❌ Missing |
