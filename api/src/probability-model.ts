/**
 * Probability distribution model for NBA player stats.
 * Uses Normal distribution for continuous stats (points, rebounds, assists)
 * and Poisson distribution for discrete stats (steals, blocks, 3PM).
 */

export interface StatDistribution {
  mean: number;
  stdDev: number;
  variance: number;
}

export interface BettingLineProbability {
  statType: string;
  lineValue: number;
  overProb: number;
  underProb: number;
  pushProb: number;
}

export interface PlayerProbabilityProfile {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  position: string;
  distributions: {
    pts: StatDistribution;
    reb: StatDistribution;
    ast: StatDistribution;
    stl: StatDistribution;
    blk: StatDistribution;
    threes: StatDistribution;
  };
  confidence: number;
}

// Normal distribution CDF using error function approximation
function normalCDF(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / stdDev;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Error function approximation (Abramowitz and Stegun)
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Poisson probability mass function
function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Poisson cumulative distribution function
function poissonCDF(k: number, lambda: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += poissonPMF(i, lambda);
  }
  return sum;
}

// Factorial with memoization
const factorialCache = new Map<number, number>();
function factorial(n: number): number {
  if (n <= 1) return 1;
  if (factorialCache.has(n)) return factorialCache.get(n)!;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  factorialCache.set(n, result);
  return result;
}

/**
 * Estimate standard deviation from season averages.
 * Uses empirical ratios based on NBA player variance patterns.
 */
function estimateStdDev(mean: number, gamesPlayed: number, statType: string): number {
  // Base variance coefficients by stat type (from historical NBA data)
  const varianceCoeffs: Record<string, number> = {
    pts: 0.35,   // Points have ~35% coefficient of variation
    reb: 0.40,   // Rebounds ~40%
    ast: 0.45,   // Assists ~45%
    stl: 0.55,   // Steals ~55%
    blk: 0.60,   // Blocks ~60%
    threes: 0.50, // 3PM ~50%
  };

  const coeff = varianceCoeffs[statType] || 0.4;
  let stdDev = mean * coeff;

  // Adjust for sample size - more games = more confidence = lower std dev
  const sampleSizeFactor = Math.sqrt(50 / Math.max(gamesPlayed, 1));
  stdDev *= Math.min(sampleSizeFactor, 1.5);

  // Minimum std dev floor
  const minStdDev: Record<string, number> = {
    pts: 2.0,
    reb: 1.0,
    ast: 0.8,
    stl: 0.4,
    blk: 0.3,
    threes: 0.5,
  };

  return Math.max(stdDev, minStdDev[statType] || 0.5);
}

/**
 * Create a probability distribution for a player's stats.
 */
export function createDistribution(
  mean: number,
  gamesPlayed: number,
  statType: string
): StatDistribution {
  const stdDev = estimateStdDev(mean, gamesPlayed, statType);
  return {
    mean,
    stdDev,
    variance: stdDev * stdDev,
  };
}

/**
 * Calculate probability of a stat going over/under a betting line.
 * Uses Normal distribution for pts/reb/ast, Poisson for stl/blk/threes.
 */
export function calculateLineProbability(
  dist: StatDistribution,
  lineValue: number,
  statType: string
): BettingLineProbability {
  const discreteStats = ["stl", "blk", "threes"];
  const isDiscrete = discreteStats.includes(statType);

  let overProb: number;
  let underProb: number;
  let pushProb: number;

  if (isDiscrete) {
    // Use Poisson distribution for discrete stats
    const lambda = dist.mean;
    const k = Math.floor(lineValue);

    // P(X > line) = 1 - P(X <= floor(line))
    overProb = 1 - poissonCDF(k, lambda);
    // P(X < line) = P(X <= ceil(line) - 1)
    underProb = poissonCDF(Math.ceil(lineValue) - 1, lambda);
    // P(X = line) for discrete
    pushProb = poissonPMF(Math.round(lineValue), lambda);

    // Adjust: over includes the push in some books, but we separate it
    overProb = Math.max(0, overProb - pushProb / 2);
    underProb = Math.max(0, underProb - pushProb / 2);
  } else {
    // Use Normal distribution for continuous stats
    // P(X > line)
    overProb = 1 - normalCDF(lineValue, dist.mean, dist.stdDev);
    // P(X < line)
    underProb = normalCDF(lineValue, dist.mean, dist.stdDev);
    // Push probability is effectively 0 for continuous
    pushProb = 0;
  }

  // Normalize to ensure probabilities sum to 1
  const total = overProb + underProb + pushProb;
  if (total > 0) {
    overProb /= total;
    underProb /= total;
    pushProb /= total;
  }

  return {
    statType,
    lineValue,
    overProb: Math.round(overProb * 10000) / 10000,
    underProb: Math.round(underProb * 10000) / 10000,
    pushProb: Math.round(pushProb * 10000) / 10000,
  };
}

/**
 * Generate common betting lines for a player based on their mean stats.
 */
export function generateCommonLines(mean: number, statType: string): number[] {
  // Round to nearest 0.5 for standard betting lines
  const roundToHalf = (v: number) => Math.round(v * 2) / 2;

  const base = roundToHalf(mean);
  const lines: number[] = [];

  // Generate lines around the mean
  for (let offset = -3; offset <= 3; offset++) {
    const line = roundToHalf(base + offset * 0.5);
    if (line >= 0.5) {
      lines.push(line);
    }
  }

  // Add some standard lines if they're close to the mean
  const standardLines: Record<string, number[]> = {
    pts: [10, 15, 20, 25, 30, 35, 40],
    reb: [4, 5, 6, 8, 10, 12],
    ast: [3, 4, 5, 6, 8, 10],
    stl: [0.5, 1, 1.5, 2],
    blk: [0.5, 1, 1.5, 2],
    threes: [1, 1.5, 2, 2.5, 3, 3.5, 4],
  };

  const standards = standardLines[statType] || [];
  for (const std of standards) {
    if (Math.abs(std - mean) <= 4 && !lines.includes(std)) {
      lines.push(std);
    }
  }

  return [...new Set(lines)].sort((a, b) => a - b);
}

/**
 * Create a full probability profile for a player.
 */
export function createPlayerProfile(
  playerId: number,
  playerName: string,
  teamAbbrev: string,
  position: string,
  stats: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    threes: number;
    gamesPlayed: number;
  }
): PlayerProbabilityProfile {
  return {
    playerId,
    playerName,
    teamAbbrev,
    position,
    distributions: {
      pts: createDistribution(stats.pts, stats.gamesPlayed, "pts"),
      reb: createDistribution(stats.reb, stats.gamesPlayed, "reb"),
      ast: createDistribution(stats.ast, stats.gamesPlayed, "ast"),
      stl: createDistribution(stats.stl, stats.gamesPlayed, "stl"),
      blk: createDistribution(stats.blk, stats.gamesPlayed, "blk"),
      threes: createDistribution(stats.threes, stats.gamesPlayed, "threes"),
    },
    confidence: calculateConfidence(stats.gamesPlayed),
  };
}

/**
 * Calculate confidence score based on games played.
 */
function calculateConfidence(gamesPlayed: number): number {
  if (gamesPlayed <= 0) return 0.05;
  if (gamesPlayed < 10) return 0.2 + (gamesPlayed / 10) * 0.3;
  if (gamesPlayed < 30) return 0.5 + ((gamesPlayed - 10) / 20) * 0.2;
  if (gamesPlayed < 50) return 0.7 + ((gamesPlayed - 30) / 20) * 0.15;
  return Math.min(0.95, 0.85 + (gamesPlayed / 82) * 0.1);
}

/**
 * Calculate all betting line probabilities for a player.
 */
export function calculateAllLineProbabilities(
  profile: PlayerProbabilityProfile
): Record<string, BettingLineProbability[]> {
  const result: Record<string, BettingLineProbability[]> = {};
  const statTypes = ["pts", "reb", "ast", "stl", "blk", "threes"] as const;

  for (const statType of statTypes) {
    const dist = profile.distributions[statType];
    const lines = generateCommonLines(dist.mean, statType);
    result[statType] = lines.map((line) =>
      calculateLineProbability(dist, line, statType)
    );
  }

  return result;
}

/**
 * Find the best betting opportunities (highest edge over 50%).
 */
export function findBestBets(
  lineProbabilities: Record<string, BettingLineProbability[]>,
  minEdge: number = 0.15
): Array<BettingLineProbability & { edge: number; recommendation: "over" | "under" }> {
  const bets: Array<BettingLineProbability & { edge: number; recommendation: "over" | "under" }> = [];

  for (const [statType, lines] of Object.entries(lineProbabilities)) {
    for (const line of lines) {
      const overEdge = line.overProb - 0.5;
      const underEdge = line.underProb - 0.5;

      if (overEdge >= minEdge) {
        bets.push({ ...line, edge: Math.round(overEdge * 10000) / 10000, recommendation: "over" });
      } else if (underEdge >= minEdge) {
        bets.push({ ...line, edge: Math.round(underEdge * 10000) / 10000, recommendation: "under" });
      }
    }
  }

  return bets.sort((a, b) => b.edge - a.edge);
}
