# Backend QA Test Plan

**Document ID:** BETA-62
**Owner:** Chief Product Officer
**Parent:** BETA-59 (Product QA - under CPO)
**Status:** Complete
**Last Updated:** April 2026

---

## 1. Purpose

Validate that all MVP backend features work correctly before dashboard launch. Ensure we don't build on unstable foundations.

---

## 2. Test Scope

### 2.1 In Scope (MVP)
- All REST API endpoints
- Data ingestion pipeline
- Prediction generation and storage
- Accuracy calculation
- Database operations

### 2.2 Out of Scope (Post-MVP)
- Frontend integration (separate QA task)
- Authentication/authorization (BETA-51 in progress)
- Paper trading (BETA-30 backend complete)
- Multi-sport predictions

---

## 3. API Endpoint Tests

### 3.1 Health & Status

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-01 | GET /api/health | 200, { status: "ok" } | Critical |

### 3.2 Predictions API

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-02 | GET /api/predictions (no date) | 200, returns today's predictions | Critical |
| API-03 | GET /api/predictions?date=2026-03-15 | 200, returns historical predictions | High |
| API-04 | GET /api/predictions with no games | 200, { games: [], predictions: [] } | High |
| API-05 | GET /api/predictions cache behavior | Second call returns cached data | Medium |
| API-06 | POST /api/predictions (valid data) | 201, prediction created | Critical |
| API-07 | POST /api/predictions (missing fields) | 400, error message | High |
| API-08 | GET /api/predictions/:id/result (exists) | 200, full prediction with player info | High |
| API-09 | GET /api/predictions/:id/result (not found) | 404, error | High |

### 3.3 History & Accuracy API

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-10 | GET /api/history | 200, array of last 200 predictions | Critical |
| API-11 | GET /api/history ordered by date desc | Most recent first | High |
| API-12 | GET /api/accuracy | 200, array of accuracy by date | Critical |
| API-13 | GET /api/predictions/score/:game_id (with results) | 200, MAE and calibration scores | High |
| API-14 | GET /api/predictions/score/:game_id (no results) | 200, message "No actual results" | High |

### 3.4 Player API

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-15 | GET /api/players/search?q=lebr | 200, array of matching players | High |
| API-16 | GET /api/players/search?q=xz | 200, empty array (too short?) | Medium |
| API-17 | GET /api/players/:id/betting-lines (valid player) | 200, profile with distributions | High |
| API-18 | GET /api/players/:id/betting-lines (invalid player) | 404, error | High |

### 3.5 Best Bets API

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-19 | GET /api/best-bets | 200, array of best bets | High |
| API-20 | GET /api/best-bets?minEdge=0.2 | 200, filtered by edge | Medium |

### 3.6 Ingestion API

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| API-21 | POST /api/ingest/today | 200, { success: true } | High |
| API-22 | POST /api/ingest/players | 200, { success: true, playersIngested: N } | High |
| API-23 | POST /api/ingest/stats | 200, { success: true, statsIngested: N } | High |

---

## 4. Data Pipeline Tests

### 4.1 NBA Data Ingestion

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| DP-01 | Today's game data ingested | Games appear in /api/predictions | Critical |
| DP-02 | Team rosters populated | Players have team/position | High |
| DP-03 | Season averages calculated | getSeasonAverages returns valid data | Critical |
| DP-04 | API rate limit handled | Graceful degradation under load | Medium |

### 4.2 Prediction Generation

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| DP-05 | generatePredictions produces output | Non-empty predictions array | Critical |
| DP-06 | Predictions stored in DB | Records appear in /api/history | Critical |
| DP-07 | Confidence scores in valid range | 0.0 - 1.0 | High |
| DP-08 | Top players ranked by confidence | Highest confidence first | High |

---

## 5. Accuracy & Validation Tests

### 5.1 MAE Calculation

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| ACC-01 | MAE for points calculated correctly | Math.abs(actual - predicted) | Critical |
| ACC-02 | MAE for rebounds calculated correctly | Math.abs(actual - predicted) | High |
| ACC-03 | MAE for assists calculated correctly | Math.abs(actual - predicted) | High |
| ACC-04 | Overall MAE is average of stat MAEs | (pts + reb + ast) / 3 | High |

### 5.2 Calibration

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| ACC-05 | Calibration within 10% threshold | % of predictions within threshold | High |
| ACC-06 | Calibration calculation correct | (correct / total) * 100 | High |

### 5.3 Actual Results

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| ACC-07 | actual_* fields populated post-game | Non-null after game completes | Critical |
| ACC-08 | Scoring updated for all prediction stats | pts, reb, ast, stl, blk, threes | High |

---

## 6. Error Handling Tests

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| ERR-01 | Invalid JSON body | 400, validation error | High |
| ERR-02 | Missing required fields | 400, specific field error | High |
| ERR-03 | Database connection failure | 500, graceful error message | Critical |
| ERR-04 | External API timeout | Fallback behavior, partial data | High |
| ERR-05 | Invalid date format | 400, error message | Medium |

---

## 7. Performance Tests

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| PERF-01 | GET /api/predictions load time | < 3 seconds | High |
| PERF-02 | Cache hit response time | < 100ms | Medium |
| PERF-03 | 50 concurrent requests | No failures, graceful | Medium |
| PERF-04 | Large history query (200 records) | < 1 second | Medium |

---

## 8. Integration Tests

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| INT-01 | Dashboard data flow end-to-end | Predictions visible after ingestion | Critical |
| INT-02 | Player search → betting lines | Search → detail works | High |
| INT-03 | Historical accuracy calculation | Scores calculated after games | High |

---

## 9. Test Execution Plan

### Phase 1: Unit Tests (Engineer ownership)
- Run existing Jest tests in /api
- Add tests for new endpoints
- Target: 80% code coverage

### Phase 2: API Integration Tests (QA Agent)
- Use Postman or curl scripts
- Test all endpoints in section 3
- Validate response schemas

### Phase 3: Data Pipeline Validation (Engineer)
- Verify ingestion produces expected data
- Check DB records after operations
- Validate prediction quality

### Phase 4: Report Results
- Document any failures
- Prioritize fixes by severity
- Sign-off on stable foundation

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Critical test pass rate | 100% |
| High priority test pass rate | > 95% |
| Medium priority test pass rate | > 80% |
| Open bugs blocking MVP | 0 |
| Performance benchmarks met | 3/4 |

---

## 11. Open Issues / Blockers

| Item | Owner | Status |
|------|-------|--------|
| BETA-40 (Fallback NBA API) | CTO | In Progress - **BLOCKER** |
| BETA-51 (Auth APIs) | CTO | In Progress |
| Stale run locks (BETA-60, BETA-61) | Tech Support | In Progress |

---

*Document links: [BETA-62](/PAP/issues/BETA-62) | [BETA-59](/PAP/issues/BETA-59) | [Goal](/PAP/goals/9c4a5a72-2d0c-42e6-9e67-b50ccf79fe3e)*
