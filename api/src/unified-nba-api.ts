/**
 * Unified NBA API Client
 * Tries balldontlie.io first, falls back to ESPN API
 */

import { getGames as getBDLGames, getSeasonAverages as getBDLSeasonAverages, BDLPlayer, BDLSeasonAverage, BDLGame } from "./nba-api.js";
import { getTodayGames as getESPNGames, getTeamRoster as getESPNRoster, getPlayerStats as getESPNStats, ESPNGame, ESPNPlayer, ESPNStat } from "./espn-nba-api.js";
import { getMockPlayers, getMockSeasonAverages, getMockGames } from "./mock-data.js";

export { BDLPlayer, BDLSeasonAverage };

let usingFallback = false;
let fallbackReason = "";

export function isUsingFallback(): boolean {
  return usingFallback;
}

export function getFallbackReason(): string {
  return fallbackReason;
}

function logFallback(source: string, reason: string) {
  if (!usingFallback) {
    console.warn(`[NBA API] Primary (${source}) failed: ${reason}. Falling back to ESPN API.`);
    usingFallback = true;
    fallbackReason = reason;
  }
}

function resetFallback() {
  usingFallback = false;
  fallbackReason = "";
}

export interface UnifiedGame {
  id: number;
  date: string;
  home_team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  visitor_team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  home_team_score: number;
  visitor_team_score: number;
  status: string;
  dataSource: "balldontlie" | "espn" | "mock";
}

export interface UnifiedPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team: {
    id: number;
    abbreviation: string;
    full_name: string;
  };
  dataSource: "balldontlie" | "espn";
}

export interface UnifiedSeasonAverage {
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
  fg3m: number;
  fg3a: number;
  turnover: number;
  dataSource: "balldontlie" | "espn" | "mock";
}

export async function getGames(date?: string): Promise<{ data: UnifiedGame[] }> {
  resetFallback();
  
  // Try balldontlie first
  try {
    const result = await getBDLGames(date);
    if (result.data.length > 0) {
      return {
        data: result.data.map((g): UnifiedGame => ({
          id: g.id,
          date: g.date,
          home_team: {
            id: g.home_team.id,
            name: g.home_team.name,
            full_name: g.home_team.full_name,
            abbreviation: g.home_team.abbreviation,
          },
          visitor_team: {
            id: g.visitor_team.id,
            name: g.visitor_team.name,
            full_name: g.visitor_team.full_name,
            abbreviation: g.visitor_team.abbreviation,
          },
          home_team_score: g.home_team_score,
          visitor_team_score: g.visitor_team_score,
          status: g.status,
          dataSource: "balldontlie" as const,
        })),
      };
    }
  } catch (err: any) {
    logFallback("balldontlie", err.message || "Unknown error");
  }
  
  // Fallback to ESPN
  try {
    const espnGames = await getESPNGames(date);
    if (espnGames.length > 0) {
      return {
        data: espnGames.map((g): UnifiedGame => ({
          id: parseInt(g.id) || 0,
          date: g.date,
          home_team: {
            id: parseInt(g.homeTeam.team.id) || 0,
            name: g.homeTeam.team.location,
            full_name: g.homeTeam.team.displayName,
            abbreviation: g.homeTeam.team.abbreviation,
          },
          visitor_team: {
            id: parseInt(g.awayTeam.team.id) || 0,
            name: g.awayTeam.team.location,
            full_name: g.awayTeam.team.displayName,
            abbreviation: g.awayTeam.team.abbreviation,
          },
          home_team_score: parseInt(g.homeTeam.score) || 0,
          visitor_team_score: parseInt(g.awayTeam.score) || 0,
          status: g.status,
          dataSource: "espn" as const,
        })),
      };
    }
  } catch (err: any) {
    logFallback("espn", err.message || "Unknown error");
  }
  
  // Use mock data as last resort
  console.warn("[NBA API] Both balldontlie and ESPN failed, using mock data");
  const mockGames = getMockGames();
  return {
    data: mockGames.map((g): UnifiedGame => ({
      id: g.id,
      date: g.date,
      home_team: {
        id: g.home_team.id,
        name: g.home_team.name,
        full_name: g.home_team.full_name,
        abbreviation: g.home_team.abbreviation,
      },
      visitor_team: {
        id: g.visitor_team.id,
        name: g.visitor_team.name,
        full_name: g.visitor_team.full_name,
        abbreviation: g.visitor_team.abbreviation,
      },
      home_team_score: g.home_team_score,
      visitor_team_score: g.visitor_team_score,
      status: g.status,
      dataSource: "mock" as const,
    })),
  };
}

export async function getSeasonAverages(playerId: number, season?: number): Promise<BDLSeasonAverage | UnifiedSeasonAverage | null> {
  resetFallback();
  
  // Try balldontlie first
  try {
    const result = await getBDLSeasonAverages(playerId, season);
    if (result) {
      return result;
    }
  } catch (err: any) {
    logFallback("balldontlie", err.message || "Unknown error");
  }
  
  // Fallback to ESPN
  try {
    const espnStats = await getESPNStats(String(playerId), season);
    if (espnStats) {
      return {
        player_id: parseInt(espnStats.playerId) || playerId,
        season: season || new Date().getFullYear(),
        games_played: espnStats.gamesPlayed,
        min: espnStats.minAvg,
        pts: espnStats.ptsAvg,
        reb: espnStats.rebAvg,
        ast: espnStats.astAvg,
        stl: espnStats.stlAvg,
        blk: espnStats.blkAvg,
        fg_pct: espnStats.fgPct,
        fg3_pct: espnStats.fg3Pct,
        ft_pct: espnStats.ftPct,
        fg3m: espnStats.fg3Pct * 5,
        fg3a: espnStats.fg3Pct * 5,
        turnover: 0,
        dataSource: "espn" as const,
      };
    }
  } catch (err: any) {
    logFallback("espn", err.message || "Unknown error");
  }
  
  // Check mock data
  const mockAverages = getMockSeasonAverages();
  const mockAvg = mockAverages.get(playerId);
  if (mockAvg) {
    return {
      ...mockAvg,
      dataSource: "mock" as const,
    };
  }
  
  return null;
}

export async function getTeamRoster(teamIds: (number | string)[]): Promise<BDLPlayer[]> {
  resetFallback();
  
  // Try balldontlie first
  try {
    const result = await getBDLRoster(teamIds.map(id => Number(id)));
    if (result.length > 0) {
      return result;
    }
  } catch (err: any) {
    logFallback("balldontlie", err.message || "Unknown error");
  }
  
  // Fallback to ESPN - fetch each team's roster
  const allPlayers: BDLPlayer[] = [];
  
  for (const teamId of teamIds) {
    try {
      const espnPlayers = await getESPNRoster(String(teamId));
      if (espnPlayers.length > 0) {
        const converted = espnPlayers.map((p): BDLPlayer => ({
          id: parseInt(p.id) || 0,
          first_name: p.firstName,
          last_name: p.lastName,
          position: p.position,
          height: "",
          weight: "",
          jersey_number: "",
          college: "",
          country: "",
          draft_year: null,
          draft_round: null,
          draft_number: null,
          team: {
            id: parseInt(String(teamId)) || 0,
            conference: "",
            division: "",
            city: p.team?.location || "",
            name: p.team?.name || "",
            full_name: p.team?.displayName || "",
            abbreviation: p.team?.abbreviation || "",
          },
        }));
        allPlayers.push(...converted);
      }
    } catch (err) {
      console.error(`Failed to fetch ESPN roster for team ${teamId}:`, err);
    }
  }
  
  if (allPlayers.length > 0) {
    return allPlayers;
  }
  
  // Use mock data as last resort
  console.warn("[NBA API] Both balldontlie and ESPN failed for team roster, using mock data");
  return getMockPlayers().filter(p => 
    teamIds.some(tid => String(tid) === String(p.team?.id))
  );
}

async function getBDLRoster(teamIds: number[]): Promise<BDLPlayer[]> {
  const allPlayers: BDLPlayer[] = [];
  
  for (const teamId of teamIds) {
    try {
      const { getTeamPlayers } = await import("./nba-api.js");
      const res = await getTeamPlayers(teamId);
      allPlayers.push(...res.data);
    } catch (err: any) {
      console.warn(`Failed to fetch balldontlie roster for team ${teamId}:`, err.message);
    }
  }
  
  return allPlayers;
}

export async function searchPlayers(query: string): Promise<BDLPlayer[]> {
  resetFallback();
  
  // Try balldontlie first
  try {
    const { searchBDLPlayers } = await import("./nba-api.js");
    return await searchBDLPlayers(query);
  } catch (err: any) {
    logFallback("balldontlie", err.message || "Unknown error");
  }
  
  // Fallback to ESPN
  const { searchPlayers: searchESPNPlayers } = await import("./espn-nba-api.js");
  const espnPlayers = await searchESPNPlayers(query);
  
  return espnPlayers.map((p): BDLPlayer => ({
    id: parseInt(p.id) || 0,
    first_name: p.firstName,
    last_name: p.lastName,
    position: p.position,
    height: "",
    weight: "",
    jersey_number: "",
    college: "",
    country: "",
    draft_year: null,
    draft_round: null,
    draft_number: null,
    team: {
      id: parseInt(p.team?.id || "0") || 0,
      conference: "",
      division: "",
      city: p.team?.location || "",
      name: p.team?.name || "",
      full_name: p.team?.displayName || "",
      abbreviation: p.team?.abbreviation || "",
    },
  }));
}
