import fetch from "node-fetch";
import { getDb } from "./db.js";

const API_BASE = "https://api.balldontlie.io/v1";

interface BdlGame {
  id: number;
  date: string;
  home_team: { id: number; full_name: string; abbreviation: string };
  visitor_team: { id: number; full_name: string; abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
}

interface BdlPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team: { id: number; full_name: string; abbreviation: string };
}

interface BdlStat {
  id: number;
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
  player: { id: number; first_name: string; last_name: string };
  game: { id: number; date: string; season: number };
}

interface BdlResponse<T> {
  data: T[];
  meta: { next_cursor: number | null; per_page: number };
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<BdlResponse<T>> {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${process.env.BALLDONTLIE_API_KEY ?? ""}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BdlResponse<T>>;
}

/**
 * Fetch all NBA games for today with pagination support.
 * @returns Array of games for today
 */
export async function fetchTodayGames(): Promise<BdlGame[]> {
  const today = new Date().toISOString().slice(0, 10);
  const all: BdlGame[] = [];
  let cursor: number | null = null;
  do {
    const params: Record<string, string> = { "dates[]": today };
    if (cursor !== null) params.cursor = String(cursor);
    const resp = await apiGet<BdlGame>("/games", params);
    all.push(...resp.data);
    cursor = resp.meta.next_cursor;
  } while (cursor !== null);
  return all;
}

/**
 * Fetch all players with pagination.
 * @param pageLimit - Maximum number of pages to fetch (default 50)
 * @returns Array of all players
 */
export async function fetchAllPlayers(pageLimit = 50): Promise<BdlPlayer[]> {
  const all: BdlPlayer[] = [];
  let cursor: number | null = null;
  let page = 0;
  do {
    const params: Record<string, string> = { per_page: "100" };
    if (cursor !== null) params.cursor = String(cursor);
    const resp = await apiGet<BdlPlayer>("/players", params);
    all.push(...resp.data);
    cursor = resp.meta.next_cursor;
    page++;
  } while (cursor !== null && page < pageLimit);
  return all;
}

/**
 * Fetch all player stats for a specific date.
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of player stats for the date
 */
export async function fetchStatsForDate(date: string): Promise<BdlStat[]> {
  const all: BdlStat[] = [];
  let cursor: number | null = null;
  do {
    const params: Record<string, string> = { "dates[]": date, per_page: "100" };
    if (cursor !== null) params.cursor = String(cursor);
    const resp = await apiGet<BdlStat>("/stats", params);
    all.push(...resp.data);
    cursor = resp.meta.next_cursor;
  } while (cursor !== null);
  return all;
}

/**
 * Insert or update games in the database.
 * @param games - Array of games to insert
 */
export function insertGames(games: BdlGame[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO games (id, date, home_team_id, home_team_name, home_team_score, visitor_team_id, visitor_team_name, visitor_team_score, season, status)
    VALUES (@id, @date, @home_team_id, @home_team_name, @home_team_score, @visitor_team_id, @visitor_team_name, @visitor_team_score, @season, @status)
    ON CONFLICT(id) DO UPDATE SET
      home_team_score = @home_team_score,
      visitor_team_score = @visitor_team_score,
      status = @status,
      updated_at = datetime('now')
  `);
  const tx = db.transaction((rows: BdlGame[]) => {
    for (const g of rows) {
      stmt.run({
        id: g.id,
        date: g.date,
        home_team_id: g.home_team.id,
        home_team_name: g.home_team.full_name,
        home_team_score: g.home_team_score,
        visitor_team_id: g.visitor_team.id,
        visitor_team_name: g.visitor_team.full_name,
        visitor_team_score: g.visitor_team_score,
        season: g.season,
        status: g.status,
      });
    }
  });
  tx(games);
}

/**
 * Insert or update players in the database.
 * @param players - Array of players to insert
 */
export function insertPlayers(players: BdlPlayer[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO players (id, first_name, last_name, team_id, team_abbreviation, position)
    VALUES (@id, @first_name, @last_name, @team_id, @team_abbreviation, @position)
    ON CONFLICT(id) DO UPDATE SET
      first_name = @first_name,
      last_name = @last_name,
      team_id = @team_id,
      team_abbreviation = @team_abbreviation,
      position = @position,
      updated_at = datetime('now')
  `);
  const tx = db.transaction((rows: BdlPlayer[]) => {
    for (const p of rows) {
      stmt.run({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        team_id: p.team?.id ?? null,
        team_abbreviation: p.team?.abbreviation ?? null,
        position: p.position || null,
      });
    }
  });
  tx(players);
}

/**
 * Insert or update player stats in the database with running average calculation.
 * @param stats - Array of stats to insert
 */
export function insertStats(stats: BdlStat[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO season_stats (player_id, season, games_played, min_avg, pts_avg, reb_avg, ast_avg, stl_avg, blk_avg, fg_pct, fg3_pct, ft_pct, turnover_avg)
    VALUES (@player_id, @season, 1, @min, @pts, @reb, @ast, @stl, @blk, @fg_pct, @fg3_pct, @ft_pct, @turnover)
    ON CONFLICT(player_id, season) DO UPDATE SET
      games_played = games_played + 1,
      pts_avg = (pts_avg * games_played + @pts) / (games_played + 1),
      reb_avg = (reb_avg * games_played + @reb) / (games_played + 1),
      ast_avg = (ast_avg * games_played + @ast) / (games_played + 1),
      stl_avg = (stl_avg * games_played + @stl) / (games_played + 1),
      blk_avg = (blk_avg * games_played + @blk) / (games_played + 1),
      min_avg = (min_avg * games_played + @min) / (games_played + 1),
      fg_pct = (fg_pct * games_played + @fg_pct) / (games_played + 1),
      fg3_pct = (fg3_pct * games_played + @fg3_pct) / (games_played + 1),
      ft_pct = (ft_pct * games_played + @ft_pct) / (games_played + 1),
      turnover_avg = (turnover_avg * games_played + @turnover) / (games_played + 1),
      created_at = datetime('now')
  `);
  const tx = db.transaction((rows: BdlStat[]) => {
    for (const s of rows) {
      if (!s.player || !s.game) continue;
      const mins = parseFloat(s.min) || 0;
      stmt.run({
        player_id: s.player.id,
        season: s.game.season,
        min: mins,
        pts: s.pts,
        reb: s.reb,
        ast: s.ast,
        stl: s.stl,
        blk: s.blk,
        fg_pct: s.fg_pct,
        fg3_pct: s.fg3_pct,
        ft_pct: s.ft_pct,
        turnover: s.turnover,
      });
    }
  });
  tx(stats);
}

/**
 * Fetch and ingest today's games and stats.
 * @returns Object with count of games and stats ingested
 */
export async function ingestToday(): Promise<{ games: number; stats: number }> {
  const games = await fetchTodayGames();
  insertGames(games);
  const today = new Date().toISOString().slice(0, 10);
  const stats = await fetchStatsForDate(today);
  insertStats(stats);
  return { games: games.length, stats: stats.length };
}

/**
 * Fetch and ingest all players.
 * @param pageLimit - Maximum pages to fetch (default 50)
 * @returns Number of players ingested
 */
export async function ingestPlayers(pageLimit = 50): Promise<number> {
  const players = await fetchAllPlayers(pageLimit);
  insertPlayers(players);
  return players.length;
}

/**
 * Fetch and ingest historical stats for multiple dates.
 * @param dates - Array of dates in YYYY-MM-DD format
 * @returns Total number of stats ingested
 */
export async function ingestHistoricalStats(dates: string[]): Promise<number> {
  let total = 0;
  for (const date of dates) {
    const stats = await fetchStatsForDate(date);
    insertStats(stats);
    total += stats.length;
  }
  return total;
}
