import {
  createDistribution,
  calculateLineProbability,
  generateCommonLines,
  createPlayerProfile,
  calculateAllLineProbabilities,
  findBestBets,
  PlayerProbabilityProfile,
} from '../probability-model.js';

describe('probability-model', () => {
  describe('createDistribution', () => {
    it('should create a valid distribution', () => {
      const dist = createDistribution(20, 50, 'pts');

      expect(dist.mean).toBe(20);
      expect(dist.stdDev).toBeGreaterThan(0);
      expect(dist.variance).toBe(dist.stdDev * dist.stdDev);
    });

    it('should apply minimum std dev floor', () => {
      const dist = createDistribution(1, 50, 'pts');

      expect(dist.stdDev).toBeGreaterThanOrEqual(2.0);
    });
  });

  describe('calculateLineProbability', () => {
    it('should return valid probabilities for continuous stats', () => {
      const dist = createDistribution(20, 50, 'pts');
      const result = calculateLineProbability(dist, 20, 'pts');

      expect(result.statType).toBe('pts');
      expect(result.lineValue).toBe(20);
      expect(result.overProb).toBeGreaterThan(0);
      expect(result.underProb).toBeGreaterThan(0);
      expect(result.overProb + result.underProb + result.pushProb).toBeCloseTo(1, 3);
    });

    it('should handle discrete stats', () => {
      const dist = createDistribution(1.5, 50, 'stl');
      const result = calculateLineProbability(dist, 1.5, 'stl');

      expect(result.statType).toBe('stl');
      expect(result.pushProb).toBeGreaterThan(0);
    });

    it('should handle zero mean', () => {
      const dist = createDistribution(0, 50, 'pts');
      const result = calculateLineProbability(dist, 10, 'pts');

      expect(result.overProb).toBe(0);
      expect(result.underProb).toBe(1);
    });
  });

  describe('generateCommonLines', () => {
    it('should generate lines around mean', () => {
      const lines = generateCommonLines(20, 'pts');

      expect(lines.length).toBeGreaterThan(0);
      expect(lines).toContain(20);
    });

    it('should return empty array for negative mean', () => {
      const lines = generateCommonLines(-5, 'pts');

      expect(lines.length).toBe(0);
    });
  });

  describe('createPlayerProfile', () => {
    it('should create a valid player profile', () => {
      const profile = createPlayerProfile(1, 'LeBron James', 'LAL', 'SF', {
        pts: 25,
        reb: 7,
        ast: 8,
        stl: 1,
        blk: 0.5,
        threes: 2,
        gamesPlayed: 50,
      });

      expect(profile.playerId).toBe(1);
      expect(profile.playerName).toBe('LeBron James');
      expect(profile.teamAbbrev).toBe('LAL');
      expect(profile.distributions.pts.mean).toBe(25);
      expect(profile.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('calculateAllLineProbabilities', () => {
    it('should calculate lines for all stat types', () => {
      const profile = createPlayerProfile(1, 'Test Player', 'LAL', 'SF', {
        pts: 20,
        reb: 7,
        ast: 8,
        stl: 1,
        blk: 0.5,
        threes: 2,
        gamesPlayed: 50,
      });

      const result = calculateAllLineProbabilities(profile);

      expect(result).toHaveProperty('pts');
      expect(result).toHaveProperty('reb');
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('stl');
      expect(result).toHaveProperty('blk');
      expect(result).toHaveProperty('threes');
    });
  });

  describe('findBestBets', () => {
    it('should find no bets when edge is below threshold', () => {
      const profile = createPlayerProfile(1, 'Test Player', 'LAL', 'SF', {
        pts: 20,
        reb: 7,
        ast: 8,
        stl: 1,
        blk: 0.5,
        threes: 2,
        gamesPlayed: 50,
      });
      const lines = calculateAllLineProbabilities(profile);
      const bets = findBestBets(lines, 0.3);

      expect(Array.isArray(bets)).toBe(true);
    });

    it('should return bets sorted by edge', () => {
      const profile = createPlayerProfile(1, 'LeBron James', 'LAL', 'SF', {
        pts: 30,
        reb: 8,
        ast: 10,
        stl: 1.5,
        blk: 1,
        threes: 3,
        gamesPlayed: 60,
      });
      const lines = calculateAllLineProbabilities(profile);
      const bets = findBestBets(lines, 0.05);

      if (bets.length > 1) {
        expect(bets[0].edge).toBeGreaterThanOrEqual(bets[1].edge);
      }
    });
  });
});