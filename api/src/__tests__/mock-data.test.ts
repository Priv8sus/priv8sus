import { jest } from '@jest/globals';
import {
  getMockPlayers,
  getMockSeasonAverages,
  getMockGames,
  MOCK_PLAYERS,
  MOCK_SEASON_AVERAGES,
  MOCK_GAMES,
} from '../mock-data.js';
import { BDLPlayer, BDLSeasonAverage } from '../nba-api.js';

describe('mock-data', () => {
  describe('getMockPlayers', () => {
    it('should return an array of mock players', () => {
      const players = getMockPlayers();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
    });

    it('should include LeBron James', () => {
      const players = getMockPlayers();
      const lebron = players.find(p => p.first_name === 'LeBron');
      expect(lebron).toBeDefined();
      expect(lebron!.last_name).toBe('James');
      expect(lebron!.team.abbreviation).toBe('LAL');
    });

    it('should have valid player structure', () => {
      const players = getMockPlayers();
      for (const player of players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('first_name');
        expect(player).toHaveProperty('last_name');
        expect(player).toHaveProperty('team');
        expect(player.team).toHaveProperty('abbreviation');
      }
    });
  });

  describe('getMockSeasonAverages', () => {
    it('should return a Map of player averages', () => {
      const averages = getMockSeasonAverages();
      expect(averages).toBeInstanceOf(Map);
      expect(averages.size).toBeGreaterThan(0);
    });

    it('should include LeBron James average', () => {
      const averages = getMockSeasonAverages();
      const lebronAvg = averages.get(2544);
      expect(lebronAvg).toBeDefined();
      expect(lebronAvg!.pts).toBeGreaterThan(0);
      expect(lebronAvg!.reb).toBeGreaterThan(0);
    });

    it('should have valid stat structure for all players', () => {
      const averages = getMockSeasonAverages();
      for (const [playerId, avg] of averages) {
        expect(playerId).toBeDefined();
        expect(avg).toHaveProperty('pts');
        expect(avg).toHaveProperty('reb');
        expect(avg).toHaveProperty('ast');
      }
    });
  });

  describe('getMockGames', () => {
    it('should return an array of mock games', () => {
      const games = getMockGames();
      expect(Array.isArray(games)).toBe(true);
      expect(games.length).toBeGreaterThan(0);
    });

    it('should have valid game structure', () => {
      const games = getMockGames();
      for (const game of games) {
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('home_team');
        expect(game).toHaveProperty('visitor_team');
        expect(game.home_team).toHaveProperty('abbreviation');
        expect(game.visitor_team).toHaveProperty('abbreviation');
      }
    });
  });

  describe('MOCK_PLAYERS constant', () => {
    it('should match getMockPlayers output', () => {
      expect(getMockPlayers()).toEqual(MOCK_PLAYERS);
    });
  });

  describe('MOCK_SEASON_AVERAGES constant', () => {
    it('should match getMockSeasonAverages output', () => {
      expect(getMockSeasonAverages()).toEqual(MOCK_SEASON_AVERAGES);
    });
  });

  describe('MOCK_GAMES constant', () => {
    it('should match getMockGames output', () => {
      expect(getMockGames()).toEqual(MOCK_GAMES);
    });
  });
});
