import { BDLPlayer, BDLSeasonAverage } from "./nba-api.js";
import {
  createPlayerProfile,
  calculateAllLineProbabilities,
  findBestBets,
  PlayerProbabilityProfile,
  BettingLineProbability,
} from "./probability-model.js";

export interface StatPrediction {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  position: string;
  predictedPts: number;
  predictedReb: number;
  predictedAst: number;
  predictedStl: number;
  predictedBlk: number;
  predictedThrees: number;
  confidence: number;
  distributions?: {
    pts: { mean: number; stdDev: number };
    reb: { mean: number; stdDev: number };
    ast: { mean: number; stdDev: number };
    stl: { mean: number; stdDev: number };
    blk: { mean: number; stdDev: number };
    threes: { mean: number; stdDev: number };
  };
  bettingLines?: Record<string, BettingLineProbability[]>;
  bestBets?: Array<BettingLineProbability & { edge: number; recommendation: "over" | "under" }>;
}

export interface PredictionResult {
  gameDate: string;
  predictions: StatPrediction[];
  topPlayers: StatPrediction[];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function roundStat(val: number, decimals: number = 1): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function estimateThrees(fg3Pct: number, fg3mAvg: number): number {
  if (fg3mAvg > 0) return roundStat(fg3mAvg);
  if (fg3Pct > 0.35) return roundStat(1.5);
  if (fg3Pct > 0.30) return roundStat(0.8);
  return roundStat(0.3);
}

/**
 * Generate stat predictions for a player based on season averages.
 * @param player - Player data from NBA API
 * @param seasonAvg - Season average statistics
 * @param includeDistributions - Whether to include probability distributions
 * @returns StatPrediction with predicted stats and optional distributions/betting lines
 */
export function predictPlayerStats(
  player: BDLPlayer,
  seasonAvg: BDLSeasonAverage | null,
  includeDistributions: boolean = true
): StatPrediction {
  if (!seasonAvg) {
    return {
      playerId: player.id,
      playerName: `${player.first_name} ${player.last_name}`,
      teamAbbrev: player.team?.abbreviation || "FA",
      position: player.position || "?",
      predictedPts: 0,
      predictedReb: 0,
      predictedAst: 0,
      predictedStl: 0,
      predictedBlk: 0,
      predictedThrees: 0,
      confidence: 0.05,
    };
  }

  const minPlayed = parseFloat(seasonAvg.min) || 0;
  const minuteFactor = clamp(minPlayed / 28, 0.7, 1.15);

  const pts = roundStat(seasonAvg.pts * minuteFactor);
  const reb = roundStat(seasonAvg.reb * minuteFactor);
  const ast = roundStat(seasonAvg.ast * minuteFactor);
  const stl = roundStat(seasonAvg.stl * minuteFactor);
  const blk = roundStat(seasonAvg.blk * minuteFactor);
  const threes = estimateThrees(seasonAvg.fg3_pct, seasonAvg.fg3m);

  const prediction: StatPrediction = {
    playerId: player.id,
    playerName: `${player.first_name} ${player.last_name}`,
    teamAbbrev: player.team?.abbreviation || "FA",
    position: player.position || "?",
    predictedPts: clamp(pts, 0, 60),
    predictedReb: clamp(reb, 0, 25),
    predictedAst: clamp(ast, 0, 20),
    predictedStl: clamp(stl, 0, 8),
    predictedBlk: clamp(blk, 0, 8),
    predictedThrees: clamp(threes, 0, 12),
    confidence: clamp(
      (clamp(seasonAvg.games_played / 50, 0, 1) * 0.4 +
        clamp(minPlayed / 30, 0, 1) * 0.3 +
        0.3),
      0.1,
      0.95
    ),
  };

  if (includeDistributions) {
    const profile = createPlayerProfile(
      player.id,
      prediction.playerName,
      prediction.teamAbbrev,
      prediction.position,
      {
        pts: prediction.predictedPts,
        reb: prediction.predictedReb,
        ast: prediction.predictedAst,
        stl: prediction.predictedStl,
        blk: prediction.predictedBlk,
        threes: prediction.predictedThrees,
        gamesPlayed: seasonAvg.games_played,
      }
    );

    prediction.distributions = {
      pts: { mean: profile.distributions.pts.mean, stdDev: profile.distributions.pts.stdDev },
      reb: { mean: profile.distributions.reb.mean, stdDev: profile.distributions.reb.stdDev },
      ast: { mean: profile.distributions.ast.mean, stdDev: profile.distributions.ast.stdDev },
      stl: { mean: profile.distributions.stl.mean, stdDev: profile.distributions.stl.stdDev },
      blk: { mean: profile.distributions.blk.mean, stdDev: profile.distributions.blk.stdDev },
      threes: { mean: profile.distributions.threes.mean, stdDev: profile.distributions.threes.stdDev },
    };

    const lineProbabilities = calculateAllLineProbabilities(profile);
    prediction.bettingLines = lineProbabilities;
    prediction.bestBets = findBestBets(lineProbabilities, 0.15);
  }

  return prediction;
}

/**
 * Rank players by their predicted impact using weighted stat scoring.
 * Weights: pts=1.0, reb=1.2, ast=1.5, stl=2.0, blk=2.0, threes=1.5
 * @param predictions - Array of player predictions
 * @returns Sorted array with highest impact players first
 */
export function rankPlayersByImpact(predictions: StatPrediction[]): StatPrediction[] {
  return [...predictions].sort((a, b) => {
    const scoreA =
      a.predictedPts * 1.0 +
      a.predictedReb * 1.2 +
      a.predictedAst * 1.5 +
      a.predictedStl * 2.0 +
      a.predictedBlk * 2.0 +
      a.predictedThrees * 1.5;
    const scoreB =
      b.predictedPts * 1.0 +
      b.predictedReb * 1.2 +
      b.predictedAst * 1.5 +
      b.predictedStl * 2.0 +
      b.predictedBlk * 2.0 +
      b.predictedThrees * 1.5;
    return scoreB - scoreA;
  });
}

/**
 * Generate predictions for multiple players and return ranked results.
 * Filters by confidence > 0.15 and returns top 20 players.
 * @param players - Array of players to predict
 * @param seasonAverages - Map of player ID to season averages
 * @param gameDate - Date of the game
 * @param includeDistributions - Whether to include probability distributions
 * @returns PredictionResult with all predictions and top 20 players
 */
export function generatePredictions(
  players: BDLPlayer[],
  seasonAverages: Map<number, BDLSeasonAverage>,
  gameDate: string,
  includeDistributions: boolean = true
): PredictionResult {
  const predictions = players.map((p) => {
    const avg = seasonAverages.get(p.id) || null;
    return predictPlayerStats(p, avg, includeDistributions);
  });

  const filtered = predictions.filter((p) => p.confidence > 0.15);
  const ranked = rankPlayersByImpact(filtered);
  const topPlayers = ranked.slice(0, 20);

  return { gameDate, predictions: ranked, topPlayers };
}
