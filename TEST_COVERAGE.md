# Test Coverage Report
*Updated: 2026-04-02 16:57 UTC*

## Current Coverage Summary

| Metric | Previous | Current |
|--------|----------|---------|
| Statements | 11.15% | 12.66% |
| Branches | 6.77% | 9.17% |
| Functions | 13.90% | 16.79% |
| Lines | 11.36% | 12.98% |

## Test Suite Status

| File | Status | Coverage |
|------|--------|----------|
| predictions.test.ts | ✅ Passing | 87.17% |
| probability-model.test.ts | ✅ Passing | 94.39% |
| paper-trading.test.ts | ✅ Passing | 66.66% |
| mock-data.test.ts | ✅ Passing | 100% |
| auth (index.ts) | ⏳ Not tested | 0% |
| email-service.ts | ⏳ Not tested | 0% |
| ingestion.ts | ⏳ Not tested | 0% |
| db.ts | ⏳ Partially mocked | 25% |

## Test Breakdown

### predictions.test.ts (21 tests)
- `predictPlayerStats`: 4 tests (zero predictions, valid predictions, clamping, distributions)
- `rankPlayersByImpact`: 2 tests (ranking, immutability)
- `generatePredictions`: 3 tests (all players, confidence filtering, empty array)

### probability-model.test.ts (15 tests)
- `createDistribution`: 2 tests (valid distribution, minimum std dev floor)
- `calculateLineProbability`: 3 tests (continuous stats, discrete stats, zero mean)
- `generateCommonLines`: 2 tests (around mean, negative mean)
- `createPlayerProfile`: 1 test
- `calculateAllLineProbabilities`: 1 test
- `findBestBets`: 2 tests (below threshold, sorted by edge)

### paper-trading.test.ts (17 tests - NEW)
- `americanToDecimal`: 3 tests (positive odds, negative odds, edge cases)
- `decimalToAmerican`: 3 tests (>=2, <2, edge at 2.0)
- `probabilityToAmerican`: 3 tests (>=0.5, <0.5, edge at 0.5)
- `americanToProbability`: 3 tests (positive odds, negative odds, valid range)
- `calculateKelly`: 7 tests (positive EV, negative edge, zero probability, Kelly divisor, bankroll, positive odds, non-negative stake)

### mock-data.test.ts (11 tests - NEW)
- `getMockPlayers`: 3 tests (array, specific player, structure validation)
- `getMockSeasonAverages`: 3 tests (Map, LeBron stats, structure validation)
- `getMockGames`: 2 tests (array, structure validation)
- Constant exports: 3 tests (verify constants match getter outputs)

## Critical Paths Needing Tests (Ranked by Risk)

| Priority | Module | Risk | Current Coverage | Why It Matters |
|----------|--------|------|------------------|----------------|
| 1 | **paper-trading.ts** | HIGH | 36.23% | Core betting logic - losses if buggy |
| 2 | **db.ts** | HIGH | 25% | Data persistence - corrupts user bets |
| 3 | **index.ts** (auth) | MEDIUM | 0% | Security surface - signup/login |
| 4 | **email-service.ts** | LOW | 0% | Non-critical - queued, can retry |
| 5 | **ingestion.ts** | MEDIUM | 0% | Data quality - bad odds = bad predictions |

## High-Risk Untested Code Paths

### paper-trading.ts
- Lines 51-65: Bet settlement logic
- Lines 114-257: Bankroll management and Kelly criterion application

### db.ts  
- Lines 292-331: Transaction handling for bet placement

### index.ts (Auth)
- Lines 34-1454: Entire auth module (signup, login, JWT validation)

## Recommendations

### Immediate (Pre-MVP)
1. **Add paper-trading integration tests** - core business logic needs coverage above 70%
2. **Add db.ts mock tests** for bet placement flow with transaction rollback

### Post-MVP
3. Add integration tests for auth using supertest
4. Mock email service for testing without RESEND_API_KEY  
5. Add database fixtures for consistent test data
6. Set coverage target to 50% for MVP launch
