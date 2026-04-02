import fetch from "node-fetch";
import { getDb } from "./db.js";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

interface EspnInjuryReport {
  player: string;
  playerId?: string;
  team: string;
  status: "Out" | "Doubtful" | "Questionable" | "Probable" | "Day-To-Day";
  description: string;
  date: string;
}

interface EspnTeamInjury {
  team: { abbreviation: string; displayName: string };
  injuries: Array<{
    athlete: {
      id: string;
      displayName: string;
      position: { abbreviation: string };
    };
    status: string;
    details: { type: { text: string }; detail: string; returnDate?: string };
  }>;
}

export interface PlayerCondition {
  playerId: number;
  playerName: string;
  gameDate: string;
  injuryStatus: string | null;
  injuryDetail: string | null;
  isBackToBack: boolean;
  restDays: number;
  recentNewsSummary: string | null;
  conditionScore: number; // -1.0 (worst) to +1.0 (best)
  dataSources: string[];
}

interface ConditionFactors {
  injuryPenalty: number;
  restBonus: number;
  newsSentiment: number;
}

// ESPN team abbreviation -> BDL team abbreviation mapping
const ESPN_TO_BDL: Record<string, string> = {
  ATL: "ATL", BOS: "BOS", BKN: "BKN", CHA: "CHA", CHI: "CHI",
  CLE: "CLE", DAL: "DAL", DEN: "DEN", DET: "DET", GSW: "GSW",
  HOU: "HOU", IND: "IND", LAC: "LAC", LAL: "LAL", MEM: "MEM",
  MIA: "MIA", MIL: "MIL", MIN: "MIN", NOP: "NOP", NYK: "NYK",
  OKC: "OKC", ORL: "ORL", PHI: "PHI", PHX: "PHX", POR: "POR",
  SAC: "SAC", SAS: "SAS", TOR: "TOR", UTA: "UTA", WAS: "WAS",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(espnName: string, bdlFirstName: string, bdlLastName: string): boolean {
  const normEspn = normalizeName(espnName);
  const normFull = normalizeName(`${bdlFirstName} ${bdlLastName}`);
  const normLast = normalizeName(bdlLastName);

  if (normEspn === normFull) return true;
  // Handle cases like "J. Smith" or partial matches
  if (normEspn.includes(normLast) && normEspn.length >= normLast.length) return true;
  return false;
}

/**
 * Fetch injury reports from ESPN for all NBA teams.
 */
export async function scrapeEspnInjuries(): Promise<EspnTeamInjury[]> {
  const results: EspnTeamInjury[] = [];

  // ESPN scoreboard endpoint lists today's games with team info
  // We can also hit team-specific injury endpoints
  try {
    const url = `${ESPN_BASE}/scoreboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN scoreboard error: ${res.status}`);
    const data = (await res.json()) as any;

    const events = data.events || [];
    const teamAbbrs = new Set<string>();

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;
      for (const competitor of competition.competitors) {
        if (competitor.team?.abbreviation) {
          teamAbbrs.add(competitor.team.abbreviation);
        }
      }
    }

    // Fetch injury data per team
    const teamArray = [...teamAbbrs];
    for (let i = 0; i < teamArray.length; i++) {
      const abbr = teamArray[i];
      try {
        const teamUrl = `${ESPN_BASE}/teams/${abbr.toLowerCase()}/injuries`;
        const teamRes = await fetch(teamUrl);
        if (!teamRes.ok) continue;
        const teamData = (await teamRes.json()) as any;

        if (teamData.injuries) {
          results.push({
            team: { abbreviation: abbr, displayName: teamData.team?.displayName || abbr },
            injuries: teamData.injuries.map((inj: any) => ({
              athlete: {
                id: inj.athlete?.id || "",
                displayName: inj.athlete?.displayName || "",
                position: { abbreviation: inj.athlete?.position?.abbreviation || "" },
              },
              status: inj.status || "Unknown",
              details: {
                type: { text: inj.details?.type?.text || "" },
                detail: inj.details?.detail || "",
                returnDate: inj.details?.returnDate,
              },
            })),
          });
        }

        if (i < teamArray.length - 1) await sleep(150);
      } catch {
        // Skip failed team fetches
      }
    }
  } catch (err) {
    console.error("ESPN injury scrape failed:", err);
  }

  return results;
}

/**
 * Fetch recent NBA news headlines from ESPN.
 */
export async function scrapeEspnNews(): Promise<Array<{ headline: string; description: string; playerNames: string[] }>> {
  try {
    const url = `${ESPN_BASE}/news`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN news error: ${res.status}`);
    const data = (await res.json()) as any;

    const articles: Array<{ headline: string; description: string; playerNames: string[] }> = [];

    for (const article of data.articles || []) {
      const headline = article.headline || "";
      const description = article.description || "";
      const content = article.content || "";

      // Extract player names from categories
      const playerNames: string[] = [];
      for (const category of article.categories || []) {
        if (category.type === "player" || category.description?.includes("player")) {
          playerNames.push(category.description || category.displayName || "");
        }
      }

      // Also extract from athlete references in the headline/description
      const fullText = `${headline} ${description} ${content}`;
      // Simple name extraction - capitalized words that could be player names
      const nameMatches = fullText.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
      for (const name of nameMatches) {
        if (!playerNames.includes(name)) {
          playerNames.push(name);
        }
      }

      articles.push({ headline, description, playerNames });
    }

    return articles;
  } catch (err) {
    console.error("ESPN news scrape failed:", err);
    return [];
  }
}

/**
 * Calculate rest days and back-to-back status from game history.
 */
export function calculateRestFactors(
  teamId: number,
  gameDate: string
): { restDays: number; isBackToBack: boolean } {
  const db = getDb();

  // Get recent games for this team
  const recentGames = db
    .prepare(
      `SELECT date FROM games
       WHERE (home_team_id = ? OR visitor_team_id = ?)
         AND date <= ?
         AND status IN ('Final', 'final', '')
       ORDER BY date DESC
       LIMIT 10`
    )
    .all(teamId, teamId, gameDate) as Array<{ date: string }>;

  if (recentGames.length < 2) {
    return { restDays: 3, isBackToBack: false }; // Default: assume adequate rest
  }

  // Find the most recent game before gameDate
  const gameDateObj = new Date(gameDate + "T00:00:00Z");
  let previousGameDate: Date | null = null;

  for (const game of recentGames) {
    const gDate = new Date(game.date + "T00:00:00Z");
    if (gDate < gameDateObj) {
      previousGameDate = gDate;
      break;
    }
  }

  if (!previousGameDate) {
    return { restDays: 3, isBackToBack: false };
  }

  const diffMs = gameDateObj.getTime() - previousGameDate.getTime();
  const restDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    restDays: Math.max(0, restDays - 1), // Subtract game day itself
    isBackToBack: restDays <= 1,
  };
}

/**
 * Determine injury penalty from status string.
 */
function getInjuryPenalty(status: string): number {
  const normalized = status.toLowerCase().trim();
  if (normalized === "out") return -0.6;
  if (normalized === "doubtful") return -0.4;
  if (normalized === "questionable") return -0.2;
  if (normalized === "day-to-day") return -0.15;
  if (normalized === "probable") return -0.05;
  return 0;
}

/**
 * Calculate rest bonus/penalty.
 */
function getRestScore(restDays: number, isBackToBack: boolean): number {
  if (isBackToBack) return -0.15;
  if (restDays === 0) return -0.05;
  if (restDays >= 3) return 0.1;
  return 0.05; // 1-2 rest days is normal
}

/**
 * Analyze news text for sentiment clues about a player.
 */
function analyzeNewsSentiment(newsSummary: string | null): number {
  if (!newsSummary) return 0;

  const lower = newsSummary.toLowerCase();

  const negativeSignals = [
    "injured", "injury", "sore", "pain", "miss", "out", "doubtful",
    "questionable", "sprain", "strain", "fracture", "surgery", "rehab",
    "limited", "restricted", "bench", "rest", "load management", "fatigue",
    "declining", "struggling", "slump",
  ];

  const positiveSignals = [
    "healthy", "cleared", "returning", "back", "hot", "streak",
    "dominant", "impressive", "career-high", "breakout", "elevated",
    "energized", "fresh",
  ];

  let score = 0;
  for (const word of negativeSignals) {
    if (lower.includes(word)) score -= 0.05;
  }
  for (const word of positiveSignals) {
    if (lower.includes(word)) score += 0.05;
  }

  return Math.max(-0.3, Math.min(0.3, score));
}

/**
 * Build a condition score for a single player.
 */
export function calculateConditionScore(factors: ConditionFactors): number {
  const raw = factors.injuryPenalty + factors.restBonus + factors.newsSentiment;
  return Math.round(Math.max(-1, Math.min(1, raw)) * 100) / 100;
}

/**
 * Match ESPN injury data to BDL player IDs using the players table.
 */
function matchInjuriesToPlayers(
  injuries: EspnTeamInjury[],
  newsArticles: Array<{ headline: string; description: string; playerNames: string[] }>
): PlayerCondition[] {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Build a map of all players from DB
  const allPlayers = db
    .prepare("SELECT id, first_name, last_name, team_abbreviation FROM players")
    .all() as Array<{ id: number; first_name: string; last_name: string; team_abbreviation: string }>;

  const conditions: PlayerCondition[] = [];

  for (const teamInjury of injuries) {
    const bdlAbbr = ESPN_TO_BDL[teamInjury.team.abbreviation] || teamInjury.team.abbreviation;

    for (const injury of teamInjury.injuries) {
      // Find matching BDL player
      const matchedPlayer = allPlayers.find(
        (p) =>
          p.team_abbreviation === bdlAbbr &&
          namesMatch(injury.athlete.displayName, p.first_name, p.last_name)
      );

      if (!matchedPlayer) continue;

      // Collect news about this player
      const playerNews: string[] = [];
      for (const article of newsArticles) {
        if (
          article.playerNames.some(
            (name) =>
              namesMatch(name, matchedPlayer.first_name, matchedPlayer.last_name) ||
              normalizeName(name).includes(normalizeName(matchedPlayer.last_name))
          )
        ) {
          playerNews.push(article.headline);
        }
      }

      const restFactors = calculateRestFactors(matchedPlayer.id, today);
      const injuryPenalty = getInjuryPenalty(injury.status);
      const restScore = getRestScore(restFactors.restDays, restFactors.isBackToBack);
      const newsScore = analyzeNewsSentiment(playerNews.length > 0 ? playerNews.join(". ") : null);

      conditions.push({
        playerId: matchedPlayer.id,
        playerName: `${matchedPlayer.first_name} ${matchedPlayer.last_name}`,
        gameDate: today,
        injuryStatus: injury.status,
        injuryDetail: injury.details.detail || injury.details.type.text || null,
        isBackToBack: restFactors.isBackToBack,
        restDays: restFactors.restDays,
        recentNewsSummary: playerNews.length > 0 ? playerNews.join(". ") : null,
        conditionScore: calculateConditionScore({
          injuryPenalty,
          restBonus: restScore,
          newsSentiment: newsScore,
        }),
        dataSources: ["espn-injuries", "espn-news", "game-schedule"],
      });
    }
  }

  return conditions;
}

/**
 * Upsert player conditions into the database.
 */
export function saveConditions(conditions: PlayerCondition[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO player_conditions (player_id, game_date, injury_status, injury_detail, is_back_to_back, rest_days, recent_news_summary, condition_score, data_sources)
    VALUES (@playerId, @gameDate, @injuryStatus, @injuryDetail, @isBackToBack, @restDays, @recentNewsSummary, @conditionScore, @dataSources)
    ON CONFLICT(player_id, game_date) DO UPDATE SET
      injury_status = @injuryStatus,
      injury_detail = @injuryDetail,
      is_back_to_back = @isBackToBack,
      rest_days = @restDays,
      recent_news_summary = @recentNewsSummary,
      condition_score = @conditionScore,
      data_sources = @dataSources,
      scraped_at = datetime('now')
  `);

  const tx = db.transaction((rows: PlayerCondition[]) => {
    for (const c of rows) {
      stmt.run({
        playerId: c.playerId,
        gameDate: c.gameDate,
        injuryStatus: c.injuryStatus,
        injuryDetail: c.injuryDetail,
        isBackToBack: c.isBackToBack ? 1 : 0,
        restDays: c.restDays,
        recentNewsSummary: c.recentNewsSummary,
        conditionScore: c.conditionScore,
        dataSources: c.dataSources.join(","),
      });
    }
  });

  tx(conditions);
}

/**
 * Full scrape pipeline: fetch injuries + news, match to players, save conditions.
 */
export async function scrapePlayerConditions(gameDate?: string): Promise<{
  injuriesFound: number;
  conditionsCreated: number;
  newsArticlesScraped: number;
}> {
  const date = gameDate || new Date().toISOString().split("T")[0];

  console.log(`Scraping player conditions for ${date}...`);

  const [injuryTeams, newsArticles] = await Promise.all([
    scrapeEspnInjuries(),
    scrapeEspnNews(),
  ]);

  const totalInjuries = injuryTeams.reduce((sum, t) => sum + t.injuries.length, 0);
  console.log(
    `Found ${totalInjuries} injuries across ${injuryTeams.length} teams, ${newsArticles.length} news articles`
  );

  const conditions = matchInjuriesToPlayers(injuryTeams, newsArticles);

  // Set the game date for all conditions
  for (const c of conditions) {
    c.gameDate = date;
  }

  if (conditions.length > 0) {
    saveConditions(conditions);
  }

  return {
    injuriesFound: totalInjuries,
    conditionsCreated: conditions.length,
    newsArticlesScraped: newsArticles.length,
  };
}

/**
 * Get conditions for specific player IDs on a given date.
 */
export function getConditionsForPlayers(
  playerIds: number[],
  gameDate: string
): Map<number, PlayerCondition> {
  const db = getDb();
  const placeholders = playerIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM player_conditions WHERE player_id IN (${placeholders}) AND game_date = ?`
    )
    .all(...playerIds, gameDate) as Array<{
    player_id: number;
    game_date: string;
    injury_status: string | null;
    injury_detail: string | null;
    is_back_to_back: number;
    rest_days: number;
    recent_news_summary: string | null;
    condition_score: number;
    data_sources: string | null;
  }>;

  const map = new Map<number, PlayerCondition>();
  for (const row of rows) {
    map.set(row.player_id, {
      playerId: row.player_id,
      playerName: "",
      gameDate: row.game_date,
      injuryStatus: row.injury_status,
      injuryDetail: row.injury_detail,
      isBackToBack: row.is_back_to_back === 1,
      restDays: row.rest_days,
      recentNewsSummary: row.recent_news_summary,
      conditionScore: row.condition_score,
      dataSources: row.data_sources ? row.data_sources.split(",") : [],
    });
  }
  return map;
}

/**
 * Apply condition score adjustment to a predicted stat value.
 */
export function applyConditionAdjustment(
  predictedValue: number,
  conditionScore: number
): number {
  // conditionScore is -1 to +1
  // -1 means very bad condition: reduce prediction by up to 30%
  // +1 means peak condition: boost prediction by up to 10%
  const multiplier = 1 + conditionScore * 0.2;
  return Math.max(0, Math.round(predictedValue * multiplier * 10) / 10);
}
