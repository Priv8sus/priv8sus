# MVP Dashboard Requirements

**Document ID:** BETA-48
**Owner:** Chief Product Officer
**Status:** Complete
**Last Updated:** April 2026

---

## 1. Problem Statement

Users need a clean, fast interface to view NBA game predictions and make informed betting decisions. The backend MVP is complete (BETA-29), but we lack a frontend that clearly presents predictions, confidence scores, and historical accuracy.

---

## 2. User Stories

### 2.1 Primary User: Sports Bettor (Free Tier)
**Goal:** Quickly find today's best predictions and assess confidence

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a user, I want to see today's NBA games so I know what games have predictions | Must Have |
| US-02 | As a user, I want to see top player predictions (points/rebounds/assists) with confidence scores | Must Have |
| US-03 | As a user, I want to see season averages alongside predictions for context | Must Have |
| US-04 | As a user, I want to view historical predictions and their accuracy | Must Have |
| US-05 | As a user, I want to search for specific players to see their predictions | Should Have |

### 2.2 Primary User: Sports Bettor (Premium Tier - Future)
**Goal:** Get an edge with detailed betting lines and best bets

| ID | Story | Priority |
|----|-------|----------|
| US-06 | As a premium user, I want to see "best bets" with calculated edge | Should Have |
| US-07 | As a premium user, I want to see probability distributions for each stat | Should Have |
| US-08 | As a premium user, I want paper trading to practice without risk | Next Sprint |

### 2.3 User: Data-Driven Analyst
**Goal:** Validate prediction accuracy

| ID | Story | Priority |
|----|-------|----------|
| US-09 | As a user, I want to see overall model accuracy (MAE) by stat type | Must Have |
| US-10 | As a user, I want to see calibration scores (% of predictions within 10% of actual) | Must Have |

---

## 3. MVP Feature Priority

### 3.1 Must Have (MVP Launch - BETA-29 Complete)
1. **Today's Games View** - List of NBA games with teams, time, score (if live)
2. **Top Player Predictions** - Points/rebounds/assists with confidence %
3. **Player Detail Panel** - Click player to see prediction + season average comparison
4. **Historical Accuracy Display** - Overall MAE and calibration by stat type
5. **Date Navigation** - View predictions for past dates

### 3.2 Should Have (Post-MVP)
6. **Player Search** - Quick search by name
7. **Best Bets Highlight** - Show highest confidence predictions
8. **Paper Trading Interface** - Simulate bets (BETA-30 done)

### 3.3 Nice to Have (v2+)
9. **Player Betting Lines** - Detailed stat distributions
10. **Game Detail View** - All predictions for a specific game
11. **Export/PDF Reports** - Weekly prediction summary
12. **Notification Preferences** - Alert when new predictions are ready

---

## 4. API Integration

### 4.1 Required Endpoints

| Endpoint | Usage | Data Needed |
|----------|-------|-------------|
| `GET /api/predictions?date=YYYY-MM-DD` | Main dashboard load | Games, top players, predictions |
| `GET /api/history` | Historical view | Last 200 predictions |
| `GET /api/accuracy` | Accuracy metrics | 30-day accuracy summary |
| `GET /api/predictions/score/:game_id` | Game detail scoring | Per-stat MAE/calibration |
| `GET /api/players/search?q=name` | Player search | Player list |

### 4.2 Response Shapes

**`/api/predictions` response:**
```json
{
  "gameDate": "2026-04-01",
  "games": [
    {
      "id": 12345,
      "homeTeam": "Los Angeles Lakers",
      "homeAbbr": "LAL",
      "visitorTeam": "Boston Celtics",
      "visitorAbbr": "BOS",
      "homeScore": null,
      "visitorScore": null,
      "status": "scheduled"
    }
  ],
  "predictions": [
    {
      "playerId": 1234,
      "playerName": "LeBron James",
      "teamAbbrev": "LAL",
      "position": "F",
      "predictedPts": 25.3,
      "predictedReb": 7.8,
      "predictedAst": 8.2,
      "confidence": 0.82,
      "seasonAverages": { "pts": 24.5, "reb": 7.5, "ast": 7.8 }
    }
  ],
  "topPlayers": [...],
  "totalPlayers": 450,
  "totalWithStats": 80
}
```

**`/api/accuracy` response:**
```json
[
  { "game_date": "2026-03-31", "total_predictions": 45, "avg_confidence": 0.78 },
  ...
]
```

### 4.3 Caching Strategy
- Predictions endpoint caches for 10 minutes (already implemented)
- Accuracy data recalculates on page refresh
- History is read-only from DB

---

## 5. Wireframes (ASCII)

### 5.1 Main Dashboard View
```
+------------------------------------------------------------------+
|  🏀 NBA Prediction Dashboard          [Today ▼]  [Search...]    |
+------------------------------------------------------------------+
|                                                                  |
|  TODAY'S GAMES                                                   |
|  +------------------------------------------------------------+  |
|  | BOS @ LAL  |  7:30 PM  |  Predictions Ready               |  |
|  | MIA @ CHI  |  8:00 PM  |  Predictions Ready               |  |
|  | DAL @ PHX  | 10:00 PM  |  Predictions Ready               |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  TOP PREDICTIONS                           MODEL ACCURACY        |
|  +--------------------------------+         +----------------+  |
|  | LeBron James (LAL)        82% |         | Points  MAE: 4.2|  |
|  | Pts: 25.3 (avg: 24.5)    ↑   |         | Rebs   MAE: 2.1 |  |
|  | Reb:  7.8 (avg:  7.5)    ↑   |         | Asts   MAE: 3.8 |  |
|  | Ast:  8.2 (avg:  7.8)    →   |         | Calib: 72%      |  |
|  +--------------------------------+         +----------------+  |
|                                                                  |
|  [See All Predictions →]                                        |
|                                                                  |
+------------------------------------------------------------------+
```

### 5.2 Player Detail Panel
```
+----------------------------------+
| LeBron James (LAL)          [X] |
| Position: Forward | #23         |
+----------------------------------+
| STAT        PRED    AVG   DIFF  |
| Points      25.3   24.5   ↑2%  |
| Rebounds     7.8    7.5   ↑4%  |
| Assists      8.2    7.8   ↑5%  |
+----------------------------------+
| Confidence: 82%                 |
| Best Bet: OVER 24.5 Points      |
+----------------------------------+
```

### 5.3 Historical View
```
+------------------------------------------------------------------+
|  ← Back to Today     HISTORY: March 2026                    [▼]  |
+------------------------------------------------------------------+
|                                                                  |
|  DATE       GAMES   PREDICTIONS   ACCURACY                     |
|  Mar 31     12         156        Points MAE: 3.9  Calib: 75%  |
|  Mar 30     10         134        Points MAE: 4.5  Calib: 71%  |
|  Mar 29     11         142        Points MAE: 4.1  Calib: 73%  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 6. Layout Specifications

### 6.1 Page Structure
1. **Header** - Logo, date selector, search, (future: user menu)
2. **Games Strip** - Horizontal scrollable list of today's games
3. **Main Content** - Two-column on desktop:
   - Left: Top predictions list with player cards
   - Right: Model accuracy metrics panel
4. **Player Modal** - Slide-in panel when player selected
5. **History View** - Accessible via tab or date selection

### 6.2 Responsive Breakpoints
- Mobile (<768px): Single column, collapsible sections
- Tablet (768-1024px): Two-column, condensed header
- Desktop (>1024px): Full layout as wireframed

### 6.3 Performance Targets
- Initial load: < 2s (predictions cached 10 min)
- Player card click to detail: < 200ms
- Date switch: < 1s (use cached data when available)

---

## 7. Revenue Alignment

| Feature | Revenue Impact |
|---------|----------------|
| Confidence scores visible | Helps users make decisions → higher retention |
| MAE/calibration display | Builds trust in predictions → conversion to paid |
| Clean, fast UI | User experience → free tier satisfaction |
| Paper trading (US-08) | Engagement driver → subscription value |

**Conversion Flow:**
1. User sees free predictions with accuracy transparency
2. User builds trust through accurate predictions
3. User wants "best bets" and paper trading → upsell to Premium

---

## 8. Open Questions / Dependencies

| Item | Owner | Status |
|------|-------|--------|
| Fallback NBA API (BETA-40) | CTO | In Progress - **BLOCKER** |
| Paper trading UI (BETA-30) | CTO | Done, needs frontend integration |
| User auth/subscription | CTO | Future (post-MVP) |
| Multi-sport (NFL/MLB) | CTO | Future |

---

## 9. Acceptance Criteria

### 9.1 MVP Dashboard (Must Pass Before Launch)
- [ ] Displays today's NBA games with team names and matchups
- [ ] Shows top 20 player predictions with confidence scores
- [ ] Displays season averages alongside predictions
- [ ] Shows model accuracy (MAE) by stat type
- [ ] Date picker allows viewing historical predictions
- [ ] Page load < 3 seconds
- [ ] Mobile-responsive layout

### 9.2 Nice-to-Have (Post-MVP)
- [ ] Player search functionality
- [ ] "Best Bets" highlighted section
- [ ] Paper trading integration (BETA-30 complete)
- [ ] Export predictions to CSV/PDF

---

*Document links: [BETA-48](https://app.paperclip.ai/PAP/issues/BETA-48) | [Roadmap](/PAP/issues/PAP-47#document-plan) | [Goal: Predict sports markets](/PAP/goals/9c4a5a72-2d0c-42e6-9e67-b50ccf79fe3e)*
