/**
 * ESPN NBA API Client - Fallback when balldontlie.io is unavailable
 * Provides games, teams, players, and stats from ESPN's public API
 */

const ESPN_NBA_API = "http://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_STATS_API = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";

export interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
}

export interface ESPNPlayer {
  id: string;
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  position: string;
  team?: ESPNTeam;
}

export interface ESPNGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: string;
  period: number;
  clock: string;
  homeTeam: {
    team: ESPNTeam;
    score: string;
    record: string;
  };
  awayTeam: {
    team: ESPNTeam;
    score: string;
    record: string;
  };
}

export interface ESPNStat {
  playerId: string;
  playerName: string;
  teamAbbrev: string;
  position: string;
  gamesPlayed: number;
  minAvg: string;
  ptsAvg: number;
  rebAvg: number;
  astAvg: number;
  stlAvg: number;
  blkAvg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
}

interface ESPNCompetition {
  id: string;
  date: string;
  competitor: Array<{
    id: string;
    homeAway: string;
    team: ESPNTeam;
    score?: string;
    record?: string;
  }>;
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competition?: ESPNCompetition;
  status?: {
    period?: number;
    clock?: string;
  };
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

async function fetchESPN<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ESPN API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function getTodayGames(date?: string): Promise<ESPNGame[]> {
  const targetDate = date || new Date().toISOString().split("T")[0].replace(/-/g, "");
  
  try {
    const url = `${ESPN_NBA_API}/scoreboard?dates=${targetDate}`;
    const data = await fetchESPN<ESPNScoreboardResponse>(url);
    
    if (!data.events || data.events.length === 0) {
      return [];
    }
    
    return data.events.map((event: ESPNEvent): ESPNGame => {
      const competition = event.competition;
      const homeCompetitor = competition?.competitor.find(c => c.homeAway === "home");
      const awayCompetitor = competition?.competitor.find(c => c.homeAway === "away");
      
      return {
        id: event.id,
        date: event.date,
        name: event.name,
        shortName: event.shortName,
        status: event.status?.period ? `Q${event.status.period}` : "PRE",
        period: event.status?.period || 0,
        clock: event.status?.clock || "",
        homeTeam: {
          team: homeCompetitor?.team || {
            id: "",
            uid: "",
            location: "Unknown",
            name: "Unknown",
            abbreviation: "UNK",
            displayName: "Unknown Team",
            shortDisplayName: "Unknown",
            color: "000000",
            alternateColor: "ffffff"
          },
          score: homeCompetitor?.score || "0",
          record: homeCompetitor?.record || ""
        },
        awayTeam: {
          team: awayCompetitor?.team || {
            id: "",
            uid: "",
            location: "Unknown",
            name: "Unknown",
            abbreviation: "UNK",
            displayName: "Unknown Team",
            shortDisplayName: "Unknown",
            color: "000000",
            alternateColor: "ffffff"
          },
          score: awayCompetitor?.score || "0",
          record: awayCompetitor?.record || ""
        }
      };
    });
  } catch (error) {
    console.error("Failed to fetch ESPN games:", error);
    return [];
  }
}

export async function getTeamRoster(teamId: string): Promise<ESPNPlayer[]> {
  try {
    const url = `${ESPN_STATS_API}/teams/${teamId}/roster`;
    const data = await fetchESPN<any>(url);
    
    const athletes = data?.athletes || [];
    return athletes.map((athlete: any): ESPNPlayer => ({
      id: athlete.id,
      uid: athlete.uid,
      firstName: athlete.firstName || athlete.displayName?.split(" ")[0] || "",
      lastName: athlete.lastName || athlete.displayName?.split(" ").slice(1).join(" ") || "",
      displayName: athlete.displayName || "",
      position: athlete.position?.abbreviation || athlete.position?.name || "",
      team: undefined
    }));
  } catch (error) {
    console.error(`Failed to fetch roster for team ${teamId}:`, error);
    return [];
  }
}

export async function getPlayerStats(playerId: string, season?: number): Promise<ESPNStat | null> {
  try {
    const url = `${ESPN_STATS_API}/athletes/${playerId}/stats`;
    const data = await fetchESPN<any>(url);
    
    const stats = data?.splits?.categories || [];
    const statsCategory = stats.find((cat: any) => cat.name === "general");
    
    if (!statsCategory) return null;
    
    const statFields = statsCategory.stats || [];
    
    const getStat = (name: string): number => {
      const stat = statFields.find((s: any) => s.name === name);
      return stat ? parseFloat(stat.value) || 0 : 0;
    };
    
    return {
      playerId,
      playerName: data.name || "",
      teamAbbrev: data.team?.abbreviation || "",
      position: data.position?.abbreviation || "",
      gamesPlayed: getStat("gamesPlayed"),
      minAvg: String(getStat("avgMinutes")),
      ptsAvg: getStat("avgPoints"),
      rebAvg: getStat("avgRebounds"),
      astAvg: getStat("avgAssists"),
      stlAvg: getStat("avgSteals"),
      blkAvg: getStat("avgBlocks"),
      fgPct: getStat("fieldGoalPct"),
      fg3Pct: getStat("threePointPct"),
      ftPct: getStat("freeThrowPct")
    };
  } catch (error) {
    console.error(`Failed to fetch stats for player ${playerId}:`, error);
    return null;
  }
}

export async function searchPlayers(query: string): Promise<ESPNPlayer[]> {
  try {
    const url = `${ESPN_NBA_API}/athletes?limit=20&search=${encodeURIComponent(query)}`;
    const data = await fetchESPN<any>(url);
    
    const athletes = data?.items || [];
    return athletes.map((athlete: any): ESPNPlayer => ({
      id: athlete.id,
      uid: athlete.uid,
      firstName: athlete.firstName || athlete.displayName?.split(" ")[0] || "",
      lastName: athlete.lastName || athlete.displayName?.split(" ").slice(1).join(" ") || "",
      displayName: athlete.displayName || "",
      position: athlete.position?.abbreviation || "",
      team: athlete.team
    }));
  } catch (error) {
    console.error(`Failed to search players:`, error);
    return [];
  }
}

export { ESPN_NBA_API, ESPN_STATS_API };
