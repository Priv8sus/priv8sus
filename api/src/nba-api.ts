const BASE_URL = "https://api.balldontlie.io/v1";

export interface BDLPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: {
    id: number;
    conference: string;
    division: string;
    city: string;
    name: string;
    full_name: string;
    abbreviation: string;
  };
}

export interface BDLSeasonAverage {
  player_id: number;
  season: number;
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  turnover: number;
  fg3m: number;
  fg3a: number;
}

export interface BDLGame {
  id: number;
  date: string;
  home_team: { id: number; name: string; full_name: string; abbreviation: string };
  visitor_team: { id: number; name: string; full_name: string; abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
  season: number;
  status: string;
  period: number;
  time: string;
}

interface BDLResponse<T> {
  data: T[];
  meta: { next_cursor: number | null; per_page: number };
}

async function fetchBDL<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<BDLResponse<T>> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // balldontlie.io free tier doesn't require auth for basic endpoints
  // but pro endpoints need an API key
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BDL API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<BDLResponse<T>>;
}

export async function getAllPlayers(cursor?: number): Promise<BDLResponse<BDLPlayer>> {
  const params: Record<string, string | number> = { per_page: 100 };
  if (cursor) params.cursor = cursor;
  return fetchBDL<BDLPlayer>("/players", params);
}

export async function getPlayer(playerId: number): Promise<BDLPlayer> {
  const url = `${BASE_URL}/players/${playerId}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`BDL API error ${res.status}`);
  const json = await res.json() as { data: BDLPlayer };
  return json.data;
}

export async function getSeasonAverages(
  playerId: number,
  season?: number
): Promise<BDLSeasonAverage | null> {
  const currentSeason = season || new Date().getFullYear();
  const params: Record<string, string | number> = {
    "player_ids[]": playerId,
    season: currentSeason,
  };

  try {
    const res = await fetchBDL<BDLSeasonAverage>("/season_averages", params);
    return res.data.length > 0 ? res.data[0] : null;
  } catch {
    // Try previous season
    const prevParams = { ...params, season: currentSeason - 1 };
    try {
      const res = await fetchBDL<BDLSeasonAverage>("/season_averages", prevParams);
      return res.data.length > 0 ? res.data[0] : null;
    } catch {
      return null;
    }
  }
}

export async function getGames(date?: string): Promise<BDLResponse<BDLGame>> {
  const targetDate = date || new Date().toISOString().split("T")[0];
  return fetchBDL<BDLGame>("/games", { "dates[]": targetDate });
}

export async function getTeamPlayers(teamId: number): Promise<BDLResponse<BDLPlayer>> {
  return fetchBDL<BDLPlayer>("/players", { per_page: 100, "team_ids[]": teamId });
}

export async function getTeamRoster(teamIds: number[]): Promise<BDLPlayer[]> {
  const allPlayers: BDLPlayer[] = [];
  for (const teamId of teamIds) {
    try {
      const res = await getTeamPlayers(teamId);
      allPlayers.push(...res.data);
    } catch (e) {
      console.error(`Failed to fetch team ${teamId}:`, e);
    }
  }
  return allPlayers;
}

export async function searchBDLPlayers(query: string, limit: number = 20): Promise<BDLPlayer[]> {
  const url = new URL(`${BASE_URL}/players`);
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", String(limit));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BALLDONTLIE_API_KEY || ""}`,
      },
    });

    if (!res.ok) {
      throw new Error(`BDL API error ${res.status}`);
    }

    const json = await res.json() as { data: BDLPlayer[] };
    return json.data;
  } catch (err) {
    throw err;
  }
}
