# QA Test Cases for MVP Features

## Context
- API: github.com/Priv8sus/priv8sus
- Frontend: /frontend directory
- Backend: /api directory
- Tests are manual test cases

---

## 1. User Signup/Login Flow

### TC-001: User Signup - Valid Credentials
**Component:** `Signup.tsx`, `AuthContext.tsx`
**Steps:**
1. Navigate to signup page
2. Enter valid email (e.g., `test@example.com`)
3. Enter password with 8+ characters
4. Confirm password (must match)
5. Click "Create Account"
**Expected:** Account created successfully, JWT token stored in localStorage, user redirected/logged in automatically
**API:** `POST /api/auth/signup`

### TC-002: User Signup - Password Too Short
**Component:** `Signup.tsx`
**Steps:**
1. Navigate to signup page
2. Enter valid email
3. Enter password with fewer than 8 characters
4. Click "Create Account"
**Expected:** Error message "Password must be at least 8 characters"
**Actual (code):** Returns 400 from API with error "Password must be at least 8 characters"

### TC-003: User Signup - Password Mismatch
**Component:** `Signup.tsx`
**Steps:**
1. Navigate to signup page
2. Enter valid email
3. Enter password
4. Enter different confirmation password
5. Click "Create Account"
**Expected:** Error message "Passwords do not match"
**Actual (code):** Client-side validation catches mismatch before API call

### TC-004: User Signup - Invalid Email
**Component:** `Signup.tsx`
**Steps:**
1. Navigate to signup page
2. Enter invalid email (e.g., `notanemail`)
3. Enter valid password
4. Confirm password
5. Click "Create Account"
**Expected:** Error or form validation preventing submission
**API:** Returns 400 "Invalid email format"

### TC-005: User Signup - Email Already Registered
**Component:** `Signup.tsx`
**Steps:**
1. Navigate to signup page
2. Enter email that already has an account
3. Enter valid password
4. Confirm password
5. Click "Create Account"
**Expected:** Error message "Email already registered"
**API:** Returns 409 from `/api/auth/signup`

### TC-006: User Login - Valid Credentials
**Component:** `Login.tsx`, `AuthContext.tsx`
**Steps:**
1. Navigate to login page
2. Enter registered email and correct password
3. Click "Sign In"
**Expected:** Login successful, JWT token stored in localStorage, user state updated
**API:** `POST /api/auth/login` returns `{ success: true, token, user }`

### TC-007: User Login - Invalid Password
**Component:** `Login.tsx`
**Steps:**
1. Navigate to login page
2. Enter registered email
3. Enter incorrect password
4. Click "Sign In"
**Expected:** Error message "Email or password is incorrect"
**API:** Returns 401 from `/api/auth/login`

### TC-008: User Login - Unregistered Email
**Component:** `Login.tsx`
**Steps:**
1. Navigate to login page
2. Enter email not in system
3. Enter any password
4. Click "Sign In"
**Expected:** Error message "Email or password is incorrect"
**API:** Returns 401 (same message for security)

### TC-009: User Logout
**Component:** `Dashboard.tsx`
**Steps:**
1. Login as valid user
2. Click "Sign Out" button
**Expected:** User logged out, token removed from localStorage, redirected to landing page
**Code:** `AuthContext.logout()` removes token and sets user to null

### TC-010: Protected Route Access
**Component:** `App.tsx`
**Steps:**
1. Attempt to access dashboard without being logged in
2. Verify user is redirected to landing page
**Expected:** Landing page shown until user logs in
**Code:** `showDashboard` state is only set true when `user` is not null

---

## 2. Dashboard Display of Predictions

### TC-011: Dashboard Loads with Today's Predictions
**Component:** `Dashboard.tsx`, `App.tsx`
**Steps:**
1. Login as valid user
2. Verify dashboard loads
**Expected:** 
- Loading spinner shown initially
- Fetch `/api/predictions?date=<today>` 
- Games strip appears if games exist
- Top predictions section appears

### TC-012: Date Navigation - Previous Day
**Component:** `Dashboard.tsx`
**Steps:**
1. On dashboard, click left arrow in date selector
2. Verify date changes to previous day
**Expected:** Predictions refresh for selected date, formatted date displayed (e.g., "Wed, Apr 1")
**Code:** `handleDateChange(-1)` decrements date, triggers `fetchPredictions`

### TC-013: Date Navigation - Future Day Disabled
**Component:** `Dashboard.tsx`
**Steps:**
1. On dashboard, click right arrow
2. Verify button is disabled if at today's date
**Expected:** Right arrow disabled when `selectedDate >= today`
**Code:** `disabled={selectedDate >= new Date().toISOString().split('T')[0]}`

### TC-014: Games Strip Display
**Component:** `Dashboard.tsx`
**Steps:**
1. On dashboard with games available
2. Verify games strip shows NBA games
**Expected:** Each game shows visitor @ home team abbreviations, game time/status, score if available
**Data:** Mapped from `/api/predictions` response `games[]` array

### TC-015: No Games Scheduled State
**Component:** `Dashboard.tsx`
**Steps:**
1. Select a date with no NBA games
2. Verify UI handles empty games array
**Expected:** "No games scheduled for this date" message displayed
**Code:** `{data.games.length === 0 && data.message && (<div className="no-games"><p>{data.message}</p></div>)}`

### TC-016: Top Predictions List
**Component:** `TopPredictions.tsx`
**Steps:**
1. On dashboard with predictions available
2. Scroll to top predictions section
**Expected:**
- List of prediction cards with player name, team, position
- Confidence badge (colored by confidence level)
- Predicted stats (Pts, Reb, Ast) with season averages in parentheses
- Trend icons (↑ ↓ →) comparing prediction to average

### TC-017: Prediction Confidence Badge Colors
**Component:** `TopPredictions.tsx`
**Steps:**
1. Review prediction cards
2. Check confidence badge coloring
**Expected:**
- `data-confidence="high"` when confidence >= 70%
- `data-confidence="medium"` when 50% <= confidence < 70%
- `data-confidence="low"` when confidence < 50%
**Code:** `confidencePercent >= 70 ? 'high' : confidencePercent >= 50 ? 'medium' : 'low'`

### TC-018: Player Detail Panel Opens
**Component:** `PlayerDetailPanel.tsx`
**Steps:**
1. Click on any prediction card
2. Verify player detail panel slides in
**Expected:** 
- Panel shows player name, team, position
- Stats comparison table (Pts, Reb, Ast) with Pred vs Avg vs Diff
- Confidence bar
- Best bets section (if available)

### TC-019: Player Detail Panel Closes
**Component:** `PlayerDetailPanel.tsx`
**Steps:**
1. With player detail panel open
2. Click X button or backdrop
**Expected:** Panel closes, `selectedPlayer` set to null

### TC-020: Error State on Dashboard
**Component:** `Dashboard.tsx`
**Steps:**
1. Simulate API failure (network issue or server error)
2. Observe error display
**Expected:** Error message shown with "Retry" button
**Code:** `error` state shows `{error && (<div className="error-state">...<button onClick={() => fetchPredictions(selectedDate)}>Retry</button>)}`

### TC-021: Model Accuracy Panel
**Component:** `Dashboard.tsx`, `AccuracyMetrics.tsx`
**Steps:**
1. View dashboard accuracy sidebar/panel
**Expected:** Shows MAE (Mean Absolute Error) for Points, Rebounds, Assists, and Calibration
**Note:** Currently displays "—" as placeholder until actual results are recorded

---

## 3. Paper Trading Functionality

### TC-022: Initialize Paper Trading Bankroll
**Component:** `paper-trading.ts`
**Steps:**
1. Call `POST /api/paper-trading/init` with optional `startBalance`
**Expected:** Bankroll initialized with $10,000 default or specified amount
**API:** `POST /api/paper-trading/init` → `{ success: true, bankroll }`

### TC-023: View Current Bankroll
**Component:** `paper-trading.ts`
**Steps:**
1. Call `GET /api/paper-trading/bankroll`
**Expected:** Returns bankroll object with start_balance, current_balance, total_wagered, win_rate, roi
**API:** `GET /api/paper-trading/bankroll`

### TC-024: Place a Paper Bet
**Component:** `paper-trading.ts`
**Steps:**
1. Call `POST /api/paper-trading/bets` with player info, game date, stat type, line, over/under, odds, stake, edge, probability
**Required fields:** playerId, playerName, gameDate, statType, line, overOrUnder, odds, stake, probability
**Expected:** Bet created with 'open' status, bankroll reduced by stake amount

### TC-025: View Open Bets
**Component:** `paper-trading.ts`
**Steps:**
1. Call `GET /api/paper-trading/bets/open`
**Expected:** Returns array of bets with status='open', ordered by creation date
**API:** `GET /api/paper-trading/bets/open`

### TC-026: View Bet History
**Component:** `paper-trading.ts`
**Steps:**
1. Call `GET /api/paper-trading/bets/history?limit=50`
**Expected:** Returns settled bets (won/lost), ordered by settle date descending
**API:** `GET /api/paper-trading/bets/history`

### TC-027: Settle a Bet - WIN
**Component:** `paper-trading.ts`
**Steps:**
1. Have an open bet
2. Call `POST /api/paper-trading/settle` with betId and actualValue that triggers win
   - For OVER: actualValue > line
   - For UNDER: actualValue < line
**Expected:** Bet status updated to 'won', profit_loss = potential_payout - stake, bankroll credited

### TC-028: Settle a Bet - LOSS
**Component:** `paper-trading.ts`
**Steps:**
1. Have an open bet
2. Call `POST /api/paper-trading/settle` with betId and actualValue that triggers loss
   - For OVER: actualValue <= line
   - For UNDER: actualValue >= line
**Expected:** Bet status updated to 'lost', profit_loss = -stake, bankroll unchanged except for initial deduction

### TC-029: Kelly Criterion Calculation
**Component:** `paper-trading.ts`
**Steps:**
1. Call `POST /api/paper-trading/kelly` with probability and odds
**Expected:** Returns fractionalKelly, stake (based on bankroll), edge, expectedValue
**Formula:** `fractionalKelly = edge / (decimalOdds - 1)`, `stake = (fractionalKelly / divisor) * bankroll`

### TC-030: Paper Trading Stats
**Component:** `paper-trading.ts`
**Steps:**
1. Call `GET /api/paper-trading/stats`
**Expected:** Returns total_bets, won_bets, lost_bets, pending_bets, win_rate, total_profit_loss, roi

### TC-031: Reset Paper Trading
**Component:** `paper-trading.ts`
**Steps:**
1. Call `POST /api/paper-trading/reset`
2. Check bankroll
**Expected:** All bets deleted, bankroll reset to start_balance with zeros for wagered/profit

### TC-032: Auto-Simulate Paper Bets
**Component:** `paper-trading.ts`
**Steps:**
1. Call `POST /api/paper-trading/simulate` with optional date, minConfidence, minEdge, maxBets
**Expected:** Automatically places bets for top predictions meeting criteria using Kelly staking

---

## 4. NBA Game Selection

### TC-033: Game Selection Filters Predictions
**Component:** `App.tsx`, `Dashboard.tsx`
**Steps:**
1. Click on a game card in the games strip
2. Verify predictions filter to show only players from that game
**Expected:** Filter badge appears showing "TEAM1@ TEAM2", predictions list updates
**Code:** `selectedGame` state filters `topPlayers` by team abbreviation

### TC-034: Clear Game Filter
**Component:** `App.tsx`
**Steps:**
1. With a game selected (filter active)
2. Click the X on the filter badge
**Expected:** Filter cleared, all predictions for date shown again

### TC-035: Game Card Shows Score When Available
**Component:** `Dashboard.tsx`
**Steps:**
1. View games with completed status
**Expected:** Score displayed as "visitorScore - homeScore" when both scores are not null
**Code:** `{game.homeScore !== null && game.visitorScore !== null ? \`${game.visitorScore} - ${game.homeScore}\` : 'Predictions Ready'}`

### TC-036: Game Status Display
**Component:** `Dashboard.tsx`
**Steps:**
1. View games strip for scheduled vs completed games
**Expected:** 
- Scheduled games show "Scheduled"
- Completed games show game status from API

---

## 5. Bet Placement (Best Bets)

### TC-037: View Best Bets for Player
**Component:** `PlayerDetailPanel.tsx`
**Steps:**
1. Click on a player prediction card
2. Scroll to "Best Bets" section in panel
**Expected:** Shows up to 3 recommended bets with stat, recommendation (OVER/UNDER), line, edge percentage

### TC-038: Best Bets Edge Threshold
**Component:** `probability-model.ts`
**Steps:**
1. Call `GET /api/players/:id/betting-lines` or `GET /api/best-bets`
**Expected:** Only bets with edge >= 15% (0.15) are included in best bets
**Code:** `findBestBets(lineProbabilities, 0.15)` in index.ts

### TC-039: Best Bets API Response
**Component:** `index.ts`
**Steps:**
1. Call `GET /api/best-bets?date=YYYY-MM-DD&minEdge=0.15`
**Expected:** Returns array of best bets across all players for given date, sorted by edge descending

---

## 6. Historical Predictions View

### TC-040: Historical View Lists Past Dates
**Component:** `HistoricalView.tsx`
**Steps:**
1. Navigate to History tab on dashboard
**Expected:** Shows list of dates with predictions, sorted most recent first
**API:** `GET /api/history` returns predictions grouped by game_date

### TC-041: Historical Date Detail View
**Component:** `HistoricalView.tsx`
**Steps:**
1. Click on a date in history list
2. Verify detailed table view appears
**Expected:** Table shows all predictions for that date with player, team, predicted vs actual stats, confidence

### TC-042: Historical Predictions with Actual Results
**Component:** `HistoricalView.tsx`
**Steps:**
1. View historical entry that has actual results recorded
**Expected:** Rows with actual values highlighted differently, showing predicted/actual comparison

### TC-043: Back to History List from Detail
**Component:** `HistoricalView.tsx`
**Steps:**
1. In detail view, click "← Back to History"
**Expected:** Returns to date list view

### TC-044: Empty Historical Data
**Component:** `HistoricalView.tsx`
**Steps:**
1. When no historical predictions exist
**Expected:** "No historical predictions yet" message displayed

---

## 7. Authentication & Protected Routes

### TC-045: Auth Token Storage
**Component:** `AuthContext.tsx`
**Steps:**
1. Login successfully
2. Check browser localStorage
**Expected:** Token stored with key `priv8sus_token`
**Code:** `localStorage.setItem(TOKEN_KEY, data.token)`

### TC-046: Auth Token on API Requests
**Component:** `AuthContext.tsx`
**Steps:**
1. With logged-in user, make authenticated API request
**Expected:** `Authorization: Bearer <token>` header included
**Code:** `fetchWithAuth()` adds header when token exists

### TC-047: Token Expiry Handling
**Component:** `AuthContext.tsx`
**Steps:**
1. Make authenticated request with expired/invalid token
**Expected:** API returns 403, user logged out
**Code:** JWT verification in `authenticateToken` middleware

### TC-048: Automatic User Refresh on Load
**Component:** `AuthContext.tsx`
**Steps:**
1. With valid token in localStorage but no user state
2. Load the app
**Expected:** `useEffect` calls `refreshUser()` which validates token and sets user state

---

## 8. Error Handling

### TC-049: Network Error on Login
**Component:** `Login.tsx`
**Steps:**
1. Attempt login while offline
**Expected:** Error message "Network error"
**Code:** `catch` block in login() returns `{ success: false, error: 'Network error' }`

### TC-050: API Server Error
**Component:** `Dashboard.tsx`
**Steps:**
1. API returns 500 error
**Expected:** Error state displayed with retry option
**Code:** `catch (err) => setError(err.message)`

### TC-051: Invalid Date Selection
**Component:** `Dashboard.tsx`
**Steps:**
1. Try to select an invalid date format
**Expected:** Date input handles validation or normalizes format

---

## Bug Observations (from code review)

1. **Accuracy Metrics Hardcoded to "—"**: `AccuracyMetrics.tsx` shows placeholder values - MAE displays "—" until actual results exist. This is by design but should be documented.

2. **Confidence Badge Threshold Mismatch**: `TopPredictions.tsx` uses 5% threshold for trend icons, but this may not align with user expectations for "meaningful" differences.

3. **Player Detail Panel Missing Stats**: When `player.seasonAverages` is undefined, the comparison table shows "—" for averages but still shows predicted values - could be confusing.

4. **Paper Trading No Frontend UI**: The paper trading functionality exists in the API but there's no visible frontend component to access it in the provided code. This may be a missing feature or work in progress.

5. **No Input Sanitization on Search**: `GET /api/players/search` uses LIKE query with user input - potential for SQL injection though parameterization should handle it.

6. **JWT Secret in Code**: `JWT_SECRET` has a fallback default value 'priv8sus-dev-secret-change-in-production' which should never be used in production.

---

## Test Execution Notes

- Test against local Docker setup: `docker-compose up` in project root
- Frontend dev server: `npm run dev` in /frontend
- API server: `npm run dev` or `npm start` in /api
- Database: SQLite (created automatically in /api/data)
- Test accounts: Create via signup flow, no admin panel for test data management


## 9. Landing Page

### TC-052: Landing Page Email Waitlist Signup - Success
**Component:** `LandingPage.tsx`
**Steps:**
1. Navigate to landing page
2. Enter valid email in hero form
3. Click "Join Waitlist"
**Expected:** Success message "You're on the list! We'll send daily NBA predictions to your inbox."
**API:** `POST /api/subscribe` with `{ email, source: 'landing_page' }`

### TC-053: Landing Page Email Validation
**Component:** `LandingPage.tsx`
**Steps:**
1. Navigate to landing page
2. Enter invalid email format
3. Attempt to submit
**Expected:** Browser-native validation prevents submission (email input has `required` and `type="email"`)

### TC-054: Landing Page Duplicate Email Signup
**Component:** `LandingPage.tsx`
**Steps:**
1. Submit email that is already on waitlist
2. Observe error
**Expected:** Error message "Something went wrong. Please try again." (API returns error for duplicate)
**API:** Returns 400 or 409 error

### TC-055: Landing Page Auth Modal - Login
**Component:** `LandingPage.tsx`, `Login.tsx`
**Steps:**
1. On landing page, click "Sign In" button
2. Verify login modal appears
3. Auth modal should have close button
**Expected:** Auth modal displays Login component with email/password fields

### TC-056: Landing Page Auth Modal - Signup
**Component:** `LandingPage.tsx`, `Signup.tsx`
**Steps:**
1. On landing page, click "Get Started" button
2. Verify signup modal appears
**Expected:** Auth modal displays Signup component with email/password fields

### TC-057: Landing Page Auth Modal Close
**Component:** `LandingPage.tsx`
**Steps:**
1. Open auth modal (login or signup)
2. Click close button to close
**Expected:** Modal closes, `authMode` set to null

### TC-058: Landing Page Dashboard Link - Logged In User
**Component:** `LandingPage.tsx`
**Steps:**
1. While logged in (user state has value)
2. View landing page navigation
**Expected:** "Dashboard" link shown instead of Sign In/Get Started buttons

### TC-059: Landing Page Stats Banner
**Component:** `LandingPage.tsx`
**Steps:**
1. View stats banner section
2. Verify stats displayed
**Expected:** All three stat cards render with values

### TC-060: Landing Page Features Section
**Component:** `LandingPage.tsx`
**Steps:**
1. Scroll to features section
2. Verify 6 feature cards render with icons and descriptions
**Expected:** All 6 feature cards present

### TC-061: Landing Page How It Works
**Component:** `LandingPage.tsx`
**Steps:**
1. Scroll to "How It Works" section
2. Verify 4 steps render with arrows between them
**Expected:** All 4 steps present

---

## 10. User Profile & Subscription

### TC-062: User Profile Opens
**Component:** `UserProfile.tsx`
**Steps:**
1. Logged in as valid user
2. Open user profile panel
**Expected:** Profile panel displays email, member since date, and subscription tier

### TC-063: User Profile Displays Subscription Tier
**Component:** `UserProfile.tsx`
**Steps:**
1. Open user profile
2. Check plan display
**Expected:** Shows "Premium" badge if premium, "Free" otherwise

### TC-064: Free User Sees Upgrade Section
**Component:** `UserProfile.tsx`
**Steps:**
1. Logged in as free-tier user with subscription data available
2. Open user profile
**Expected:** Upgrade section visible with feature list and upgrade button

### TC-065: Premium User Does Not See Upgrade Section
**Component:** `UserProfile.tsx`
**Steps:**
1. Logged in as premium user
2. Open user profile
**Expected:** Upgrade section hidden

### TC-066: User Profile Sign Out
**Component:** `UserProfile.tsx`
**Steps:**
1. Open user profile
2. Click "Sign Out" button
**Expected:** User logged out, redirected appropriately

### TC-067: User Profile Close Button
**Component:** `UserProfile.tsx`
**Steps:**
1. User profile opened with `onClose` prop
2. Click close button
**Expected:** `onClose` callback invoked

### TC-068: Subscription Success Callback
**Component:** `UserProfile.tsx`
**Steps:**
1. Load page with `?subscription=success` query param
2. Observe URL and subscription state
**Expected:** `refreshSubscription()` called, URL cleaned to remove query param

### TC-069: Upgrade Button Without PriceId
**Component:** `UserProfile.tsx`
**Steps:**
1. Logged in as free user with subscription but missing premium priceId
2. Click upgrade button
**Expected:** No action (early return if priceId missing)

---

## Bug Observations - Additional

7. **Hardcoded Social Proof Number**: Landing page shows "Join 1,247 bettors" - hardcoded, should be dynamic
8. **Hardcoded Stats**: Stats banner shows placeholder marketing numbers, not real data
9. **UserProfile Graceful Null Handling**: Returns `null` if `user` is falsy - could silently hide component

---

## Test Execution Notes

- Test against local Docker setup: `docker-compose up` in project root
- Frontend: http://localhost:80 (docker-frontend)
- API: http://localhost:3000 (docker-api)
- Database: PostgreSQL at localhost:5432
- Redis: localhost:6379
- Test accounts: Create via signup flow, no admin panel for test data management
- Paper trading reset: Use `POST /api/paper-trading/reset` endpoint

---

## 11. Smoke Test Script

A post-deploy smoke test script is available at `smoke-test.js` in the project root.

### Running Smoke Tests

```bash
# Set API URL (defaults to http://localhost:3000)
export API_URL=http://your-production-api.com

# Run smoke tests
node smoke-test.js
```

### Smoke Test Coverage

| Category | Endpoints Tested |
|----------|-----------------|
| Health | `/api/health`, `/api/monitoring/error-stats` |
| Auth | signup, login, me, onboarding-complete, tour-complete |
| Predictions | `/api/predictions`, `/api/history`, `/api/accuracy`, `/api/best-bets` |
| Analytics | daily-active-users, signups, retention, paper-trades |
| Paper Trading | init, bankroll, stats, bets, kelly, settle, reset |
| Newsletter | `/api/subscribe` |

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

---

## 12. API Response Codes & Error Handling

### Standard HTTP Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (signup, bet placed, etc.) |
| 400 | Bad Request | Missing required fields, invalid email format, password too short |
| 401 | Unauthorized | Invalid credentials, missing/invalid JWT token |
| 403 | Forbidden | Expired token, invalid token signature |
| 404 | Not Found | Resource doesn't exist (player, prediction, bet) |
| 409 | Conflict | Email already registered, duplicate subscription |
| 429 | Too Many Requests | Rate limit exceeded (auth: 10/15min, global: 100/15min) |
| 500 | Internal Server Error | Database error, API failure, unhandled exception |

### Endpoint-Specific Response Examples

#### POST /api/auth/signup
- **200**: `{ success: true, message: "Account created successfully", token: "...", user: { id, email } }`
- **400**: `{ error: "Email and password are required" }` | `{ error: "Invalid email format" }` | `{ error: "Password must be at least 8 characters" }`
- **409**: `{ error: "Email already registered" }`
- **429**: `{ error: "Too many authentication attempts, please try again later." }`

#### POST /api/auth/login
- **200**: `{ success: true, message: "Login successful", token: "...", user: { id, email, onboardingCompleted, isFirstLogin } }`
- **400**: `{ error: "Email and password are required" }`
- **401**: `{ error: "Invalid credentials", message: "Email or password is incorrect" }`
- **429**: Rate limited

#### GET /api/predictions
- **200**: `{ gameDate, games[], predictions[], topPlayers[], totalPlayers, totalWithStats }`
- **200 (no games)**: `{ gameDate, games: [], predictions: [], topPlayers: [], message: "No games scheduled for this date" }`
- **500**: `{ error: "..." }` on API/internal error

#### POST /api/paper-trading/bets
- **201**: `{ success: true, bet: { id, playerId, status: "open", ... } }`
- **400**: `{ error: "Missing required fields" }`
- **500**: `{ error: "..." }` on failure

#### POST /api/paper-trading/settle
- **200**: `{ success: true, bet: { id, status: "won"|"lost", profit_loss, ... } }`
- **404**: `{ error: "Bet not found or already settled" }`
- **400**: `{ error: "Missing betId or actualValue" }`

### Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Global API | 100 requests | 15 minutes |
| Auth (signup, login) | 10 requests | 15 minutes |

Response when rate limited: `{ error: "Too many requests, please try again later." }`

---

## 13. Edge Cases

### Authentication Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Login with case-variant email | Normalizes to lowercase, login succeeds |
| Signup with whitespace in email | Trims whitespace, normalizes to lowercase |
| Very long password (>100 chars) | Accepted (bcrypt handles hashing) |
| Empty string email | Returns 400 "Email and password are required" |
| SQL injection in email field | Parameterized queries prevent injection |
| Token manipulation | Returns 403 "Invalid or expired token" |

### Predictions Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No NBA games on date | Returns empty games array with message |
| Player without season averages | Prediction confidence = 0.05, all stats = 0 |
| API rate limit during fetch | Skips player, logs warning, continues |
| Cache hit | Returns cached response within TTL (10 min) |
| Very high confidence (>95%) | Clamped to reasonable bounds |

### Paper Trading Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bet on non-existent player | Accepted (no validation) |
| Settle already-settled bet | Returns 404 "Bet not found or already settled" |
| Stake > bankroll | Bet placed, bankroll can go negative |
| Zero stake | Bet placed, no bankroll change |
| Negative odds | Handled by kelly calculation |

### Database Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| DB file missing | Auto-created on init |
| Concurrent writes | SQLite handles via WAL mode |
| Disk full | Write fails, 500 error returned |

### Email Service Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| RESEND_API_KEY not set | Email sends skipped silently |
| Invalid email in subscribe | Returns 400 "Invalid email format" |
| Duplicate newsletter subscriber | Returns 409 "Email already subscribed" or reactivates |
