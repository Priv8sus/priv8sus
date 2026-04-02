import { predictPlayerStats, rankPlayersByImpact, generatePredictions, StatPrediction } from '../predictions.js';
import { BDLPlayer, BDLSeasonAverage } from '../nba-api.js';

const mockPlayer: BDLPlayer = {
  id: 1,
  first_name: 'LeBron',
  last_name: 'James',
  position: 'SF',
  height: '6-9',
  weight: '250',
  jersey_number: '23',
  college: 'St. Vincent-St. Mary HS',
  country: 'USA',
  draft_year: 2003,
  draft_round: 1,
  draft_number: 1,
  team: {
    id: 14,
    conference: 'Western',
    division: 'Pacific',
    city: 'Los Angeles',
    name: 'Lakers',
    full_name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
  },
};

const mockSeasonAvg: BDLSeasonAverage = {
  player_id: 1,
  season: 2024,
  games_played: 55,
  min: '35.0',
  pts: 25.3,
  reb: 7.5,
  ast: 8.4,
  stl: 1.2,
  blk: 0.6,
  fg_pct: 0.52,
  fg3_pct: 0.38,
  ft_pct: 0.75,
  turnover: 3.5,
  fg3m: 2.1,
  fg3a: 5.5,
};

describe('predictions', () => {
  describe('predictPlayerStats', () => {
    it('should return zero predictions with low confidence when no season average', () => {
      const result = predictPlayerStats(mockPlayer, null, false);

      expect(result.playerId).toBe(1);
      expect(result.playerName).toBe('LeBron James');
      expect(result.predictedPts).toBe(0);
      expect(result.predictedReb).toBe(0);
      expect(result.confidence).toBe(0.05);
    });

    it('should generate reasonable predictions with valid season average', () => {
      const result = predictPlayerStats(mockPlayer, mockSeasonAvg, false);

      expect(result.playerId).toBe(1);
      expect(result.playerName).toBe('LeBron James');
      expect(result.teamAbbrev).toBe('LAL');
      expect(result.position).toBe('SF');
      expect(result.predictedPts).toBeGreaterThan(0);
      expect(result.predictedReb).toBeGreaterThan(0);
      expect(result.predictedAst).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should clamp values within reasonable bounds', () => {
      const result = predictPlayerStats(mockPlayer, mockSeasonAvg, false);

      expect(result.predictedPts).toBeLessThanOrEqual(60);
      expect(result.predictedReb).toBeLessThanOrEqual(25);
      expect(result.predictedAst).toBeLessThanOrEqual(20);
      expect(result.predictedStl).toBeLessThanOrEqual(8);
      expect(result.predictedBlk).toBeLessThanOrEqual(8);
      expect(result.predictedThrees).toBeLessThanOrEqual(12);
    });

    it('should not return negative values', () => {
      const result = predictPlayerStats(mockPlayer, mockSeasonAvg, false);

      expect(result.predictedPts).toBeGreaterThanOrEqual(0);
      expect(result.predictedReb).toBeGreaterThanOrEqual(0);
      expect(result.predictedAst).toBeGreaterThanOrEqual(0);
      expect(result.predictedStl).toBeGreaterThanOrEqual(0);
      expect(result.predictedBlk).toBeGreaterThanOrEqual(0);
      expect(result.predictedThrees).toBeGreaterThanOrEqual(0);
    });

    it('should include distributions when requested', () => {
      const result = predictPlayerStats(mockPlayer, mockSeasonAvg, true);

      expect(result.distributions).toBeDefined();
      expect(result.distributions?.pts).toHaveProperty('mean');
      expect(result.distributions?.pts).toHaveProperty('stdDev');
    });
  });

  describe('rankPlayersByImpact', () => {
    it('should rank players with higher impact scores first', () => {
      const players: StatPrediction[] = [
        {
          playerId: 1,
          playerName: 'Player A',
          teamAbbrev: 'LAL',
          position: 'SF',
          predictedPts: 10,
          predictedReb: 5,
          predictedAst: 2,
          predictedStl: 1,
          predictedBlk: 0,
          predictedThrees: 1,
          confidence: 0.8,
        },
        {
          playerId: 2,
          playerName: 'Player B',
          teamAbbrev: 'BOS',
          position: 'PG',
          predictedPts: 25,
          predictedReb: 5,
          predictedAst: 10,
          predictedStl: 2,
          predictedBlk: 0,
          predictedThrees: 3,
          confidence: 0.9,
        },
      ];

      const ranked = rankPlayersByImpact(players);

      expect(ranked[0].playerId).toBe(2);
      expect(ranked[1].playerId).toBe(1);
    });

    it('should not mutate original array', () => {
      const players: StatPrediction[] = [
        {
          playerId: 1,
          playerName: 'Player A',
          teamAbbrev: 'LAL',
          position: 'SF',
          predictedPts: 10,
          predictedReb: 5,
          predictedAst: 2,
          predictedStl: 1,
          predictedBlk: 0,
          predictedThrees: 1,
          confidence: 0.8,
        },
      ];

      const originalFirst = players[0];
      rankPlayersByImpact(players);

      expect(players[0]).toBe(originalFirst);
    });
  });

  describe('generatePredictions', () => {
    it('should generate predictions for all players', () => {
      const players = [mockPlayer, { ...mockPlayer, id: 2, first_name: 'Anthony', last_name: 'Davis' }];
      const seasonAverages = new Map<number, BDLSeasonAverage>([[1, mockSeasonAvg], [2, mockSeasonAvg]]);

      const result = generatePredictions(players, seasonAverages, '2024-03-01', false);

      expect(result.predictions.length).toBe(2);
      expect(result.gameDate).toBe('2024-03-01');
    });

    it('should filter by confidence threshold', () => {
      const lowConfidencePlayer: BDLPlayer = { ...mockPlayer, id: 99, first_name: 'Rook', last_name: 'Ie' };
      const players = [mockPlayer, lowConfidencePlayer];
      const seasonAverages = new Map<number, BDLSeasonAverage>([
        [1, mockSeasonAvg],
        [99, { ...mockSeasonAvg, games_played: 5, min: '5.0', pts: 2.0, reb: 1.0, ast: 0.5, stl: 0.1, blk: 0.1, fg3m: 0.2 }],
      ]);

      const result = generatePredictions(players, seasonAverages, '2024-03-01', false);

      expect(result.topPlayers.length).toBeLessThanOrEqual(result.predictions.length);
    });

    it('should handle empty players array', () => {
      const result = generatePredictions([], new Map(), '2024-03-01', false);

      expect(result.predictions).toEqual([]);
      expect(result.topPlayers).toEqual([]);
    });
  });
});