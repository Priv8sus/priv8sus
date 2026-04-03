# User Stories for MVP Launch

**Product:** Priv8sus NBA Prediction Platform
**Date:** 2026-04-02
**Owner:** CPO
**Purpose:** Define first 10 user experience + identify MVP gaps

---

## User Personas

### Persona 1: Casual NBA Fan ("Jake")
- **Age:** 28
- **Occupation:** Marketing manager
- **Betting experience:** Minimal, watches games for entertainment
- **Motivation:** Wants to sound smart during fantasy drafts and water cooler talk
- **Tech savviness:** Medium, uses Instagram/Twitter for sports updates
- **Pain points:** Doesn't understand advanced stats, overwhelmed by odds

### Persona 2: Office Pool Organizer ("Marcus")
- **Age:** 35
- **Occupation:** IT manager
- **Betting experience:** Runs weekly office picks pool (squares, survivor)
- **Motivation:** Make the pool more exciting, gain respect as "that guy who knows sports"
- **Tech savviness:** High, comfortable with spreadsheets and web apps
- **Pain points:** No data to back up gut feelings, pool participation declining

### Persona 3: Fantasy Sports Obsessive ("Priya")
- **Age:** 31
- **Occupation:** Financial analyst
- **Betting experience:** Daily fantasy sports (DraftKings/FanDuel), parlay bettor
- **Motivation:** Find edges in player prop bets, improve DFS lineup decisions
- **Tech savviness:** Very high, uses multiple data sources
- **Pain points:** Existing tools are expensive, too much noise, hard to isolate signal

### Persona 4: Reformed Sports Bettor ("Derek")
- **Age:** 42
- **Occupation:** Construction foreman
- **Betting experience:** Former problem gambler, quit real betting 2 years ago
- **Motivation:** Get the thrill of betting without the financial harm
- **Tech savviness:** Low, just wants something simple that works
- **Pain points:** Wants to avoid real money apps, values privacy

### Persona 5: Data-Driven Degenerate ("Sam")
- **Age:** 26
- **Occupation:** Software engineer
- **Betting experience:** Math-based bettor, builds own models in Python/R
- **Motivation:** Validate or disprove their own models, see if Priv8sus has alpha
- **Tech savviness:** Very high, reverse-engineers APIs, wants raw data access
- **Pain points:** Doesn't trust black-box predictions, wants to see methodology

---

## User Stories

### Jake (Casual Fan)

**Story 1: Today's Games at a Glance**
- **As a** casual NBA fan
- **I want to** open the app and see today's games immediately
- **So that** I know what games to watch tonight
- **Acceptance criteria:**
  - Dashboard loads within 3 seconds
  - Today's date is prominently displayed
  - All games list teams, time, and key matchup info

**Story 2: Impress My Friends**
- **As a** casual NBA fan
- **I want to** see "best bet" highlights
- **So that** I can sound informed during group chats
- **Acceptance criteria:**
  - "Best Bet" badge visible on dashboard
  - Simple language explanation (not jargon)
  - Updates daily before game time

**Story 3: Paper Trading for Fun**
- **As a** casual NBA fan
- **I want to** place fake bets and see if I win
- **So that** I can enjoy the thrill without losing money
- **Acceptance criteria:**
  - Virtual bankroll of $1,000
  - One-click bet placement
  - Win/loss result shown after game

---

### Marcus (Office Pool Organizer)

**Story 4: Quick Team Insights**
- **As an** office pool organizer
- **I want to** see key stats for each team in 30 seconds
- **So that** I can make smarter picks and brag about results
- **Acceptance criteria:**
  - Top 3 players per team shown with season averages
  - Team ranking in key categories (points, defense)
  - Mobile-friendly for quick checks during meetings

**Story 5: Share Picks with Coworkers**
- **As an** office pool organizer
- **I want to** share my predicted winners easily
- **So that** I can distribute picks to the office Slack/email
- **Acceptance criteria:**
  - "Share" button on each game prediction
  - Clean text output (not screenshot)
  - Copy-to-clipboard functionality

**Story 6: Track Pool Performance**
- **As an** office pool organizer
- **I want to** see my prediction accuracy over time
- **So that** I can prove I'm worth listening to
- **Acceptance criteria:**
  - Win/loss record visible on profile
  - Historical accuracy percentage
  - Comparison to "random chance" baseline

---

### Priya (Fantasy Sports Obsessive)

**Story 7: Deep Player Props**
- **As a** DFS player
- **I want to** see detailed player stat predictions (points, rebounds, assists, steals, blocks, 3PT)
- **So that** I can build optimized lineups
- **Acceptance criteria:**
  - All 6 stat categories available for top players
  - Confidence interval shown for each prediction
  - Projected vs season average comparison

**Story 8: Lineup Building助手**
- **As a** DFS player
- **I want to** export predictions for multiple players at once
- **So that** I can quickly populate my DraftKings entry
- **Acceptance criteria:**
  - Select multiple players for export
  - CSV or copy-paste format
  - Include projected stats + confidence score

**Story 9: Late Injury Updates**
- **As a** DFS player
- **I want to** see injury/availability news for players
- **So that** I can pivot lineups before lock
- **Acceptance criteria:**
  - Injury status displayed on player card
  - "GTD" (game-time decision) flag
  - Last updated timestamp visible

---

### Derek (Reformed Sports Bettor)

**Story 10: Zero Financial Risk**
- **As a** reformed gambler
- **I want to** use only paper trading with no way to add real money
- **So that** I can enjoy betting psychology without relapse risk
- **Acceptance criteria:**
  - No payment flows whatsoever
  - Clear "play money only" badge
  - Cannot enter credit card or bank info

**Story 11: Simple, No Nonsense**
- **As a** reformed gambler
- **I want to** understand predictions without a statistics degree
- **So that** I can enjoy the app without confusion
- **Acceptance criteria:**
  - Plain English explanations
  - "Will player X score more than 25 points?" format
  - Yes/No/Green/Red visual indicators

**Story 12: Privacy Protected**
- **As a** privacy-conscious user
- **I want to** use the app without my data being sold
- **So that** I don't get targeted by gambling ads elsewhere
- **Acceptance criteria:**
  - Privacy policy clearly states no data selling
  - No social login required
  - Email-only signup

---

### Sam (Data-Driven Degenerate)

**Story 13: See the Model's Reasoning**
- **As a** data-driven bettor
- **I want to** understand why the model made a prediction
- **So that** I can evaluate if it's legitimate or garbage
- **Acceptance criteria:**
  - Key factors listed for each prediction
  - Weighting shown (e.g., "70% based on recent form, 30% home/away")
  - Historical accuracy of similar predictions

**Story 14: Download Historical Data**
- **As a** data-driven bettor
- **I want to** export prediction history as CSV
- **So that** I can run my own analysis in Python/R
- **Acceptance criteria:**
  - Date range selector for exports
  - CSV with player, prediction, actual, accuracy
  - Include model version for reproducibility

**Story 15: API Access for Power Users**
- **As a** data-driven bettor
- **I want to** query predictions via API
- **So that** I can build my own dashboards and automation
- **Acceptance criteria:**
  - API endpoint documentation available
  - API key management in account settings
  - Rate limit clearly stated (e.g., 100 calls/hour)

---

## MVP Feature Mapping

| Story | Feature | Status | Gap |
|-------|---------|--------|-----|
| 1-3 | Dashboard + Today's Games | Done | Need to verify on prod |
| 4-6 | Team/Player Stats Display | Done | None |
| 7-9 | Player Props (6 stats) | Done | Steals/blocks/3PT cut for MVP |
| 10-12 | Paper Trading | Done | None |
| 13 | Model explainability | **Missing** | Not in MVP scope |
| 14 | Historical export | **Missing** | Not in MVP scope |
| 15 | API access | **Missing** | Sharp Edge tier (later) |

---

## Top 3 MVP Gaps for First 10 Users

1. **No model explainability** (Story 13) — Power users (Sam, Priya) will question black-box predictions. Consider adding "Key Factors" to predictions in Week 2 update.

2. **No injury data** (Story 9) — DFS players (Priya) need injury news to make lineup changes. News scraping was deferred but is critical for this persona.

3. **No historical export** (Story 14) — Sam cannot validate the model without data export. Even a simple CSV download would satisfy this user.

---

## Retention Risks

| Persona | Retention Risk | Mitigation |
|---------|---------------|------------|
| Jake | Low engagement after novelty | Email digest with "hot picks" |
| Marcus | Won't return if pool loses interest | Social sharing features (Story 5) |
| Priya | High churn if accuracy < 55% | Must deliver >55% or lose this user |
| Derek | Stable, low ARPU but low churn | Works as designed |
| Sam | High churn risk if no API or explainability | Need early access to data |

---

*Document version 1.0 — Update after first 10 users onboarded*