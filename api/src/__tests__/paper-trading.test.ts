import { jest } from '@jest/globals';
import {
  calculateKelly,
  americanToDecimal,
  decimalToAmerican,
  probabilityToAmerican,
  americanToProbability,
  initBankroll,
  getBankroll,
  getOpenBets,
  getBetHistory,
  getBetStats,
  resetPaperTrading,
} from '../paper-trading.js';

jest.mock('../db.js', () => ({
  getDb: jest.fn(() => ({
    prepare: jest.fn(() => ({
      get: jest.fn(() => ({ 
        id: 1,
        start_balance: 10000,
        current_balance: 10000,
        total_wagered: 0,
        total_profit_loss: 0,
        win_rate: 0,
        roi: 0,
        updated_at: '2026-04-02T00:00:00.000Z',
      })),
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
      all: jest.fn().mockReturnValue([]),
    })),
  })),
}));

jest.mock('../analytics.js', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../utils/logging.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('paper-trading', () => {
  describe('americanToDecimal', () => {
    it('should convert positive American odds to decimal', () => {
      expect(americanToDecimal(100)).toBe(2.0);
      expect(americanToDecimal(150)).toBe(2.5);
      expect(americanToDecimal(200)).toBe(3.0);
    });

    it('should convert negative American odds to decimal', () => {
      expect(americanToDecimal(-100)).toBe(2.0);
      expect(americanToDecimal(-150)).toBeCloseTo(1.6667, 3);
      expect(americanToDecimal(-200)).toBe(1.5);
    });

    it('should handle edge cases', () => {
      expect(americanToDecimal(1)).toBe(1.01);
      expect(americanToDecimal(-500)).toBe(1.2);
    });
  });

  describe('decimalToAmerican', () => {
    it('should convert decimal odds >= 2 to positive American odds', () => {
      expect(decimalToAmerican(2.0)).toBe(100);
      expect(decimalToAmerican(2.5)).toBe(150);
      expect(decimalToAmerican(3.0)).toBe(200);
    });

    it('should convert decimal odds < 2 to negative American odds', () => {
      expect(decimalToAmerican(1.5)).toBe(-200);
      expect(decimalToAmerican(1.6666666666666667)).toBeCloseTo(-150, 5);
      expect(decimalToAmerican(1.01)).toBeCloseTo(-9999.99, 0);
    });

    it('should handle edge case at exactly 2.0', () => {
      expect(decimalToAmerican(2.0)).toBe(100);
    });
  });

  describe('probabilityToAmerican', () => {
    it('should convert probability >= 0.5 to negative American odds', () => {
      expect(probabilityToAmerican(0.5)).toBe(-100);
      expect(probabilityToAmerican(0.6)).toBeCloseTo(-66.67, 1);
      expect(probabilityToAmerican(0.6666)).toBeCloseTo(-50.02, 0);
      expect(probabilityToAmerican(0.75)).toBeCloseTo(-33.33, 1);
    });

    it('should convert probability < 0.5 to positive American odds', () => {
      expect(probabilityToAmerican(0.49)).toBeCloseTo(196.08, 1);
      expect(probabilityToAmerican(0.4)).toBeCloseTo(166.67, 1);
      expect(probabilityToAmerican(0.25)).toBeCloseTo(133.33, 1);
    });

    it('should handle edge case at exactly 0.5', () => {
      expect(probabilityToAmerican(0.5)).toBe(-100);
    });
  });

  describe('americanToProbability', () => {
    it('should convert positive American odds to probability', () => {
      expect(americanToProbability(100)).toBeCloseTo(0.5, 5);
      expect(americanToProbability(200)).toBeCloseTo(0.3333, 3);
      expect(americanToProbability(300)).toBeCloseTo(0.25, 5);
    });

    it('should convert negative American odds to probability', () => {
      expect(americanToProbability(-100)).toBeCloseTo(0.5, 5);
      expect(americanToProbability(-150)).toBeCloseTo(0.6, 5);
      expect(americanToProbability(-200)).toBeCloseTo(0.6666, 3);
    });

    it('should return probabilities between 0 and 1', () => {
      const odds = [-500, -200, -100, 100, 200, 300, 500];
      for (const odd of odds) {
        const prob = americanToProbability(odd);
        expect(prob).toBeGreaterThan(0);
        expect(prob).toBeLessThan(1);
      }
    });
  });

  describe('calculateKelly', () => {
    it('should calculate Kelly bet correctly for positive expected value', () => {
      const result = calculateKelly(0.7, -200, 2);

      expect(result.probability).toBe(0.7);
      expect(result.odds).toBe(-200);
      expect(result.edge).toBeGreaterThan(0);
      expect(result.stake).toBeGreaterThan(0);
      expect(result.fractionalKelly).toBeGreaterThan(0);
    });

    it('should return zero stake when edge is negative', () => {
      const result = calculateKelly(0.3, -150, 2);

      expect(result.edge).toBeLessThan(0);
      expect(result.stake).toBe(0);
    });

    it('should return zero stake when probability is 0', () => {
      const result = calculateKelly(0, 100, 2);

      expect(result.edge).toBe(-0.5);
      expect(result.stake).toBe(0);
    });

    it('should respect the Kelly divisor', () => {
      const resultHalf = calculateKelly(0.7, -200, 2);
      const resultQuarter = calculateKelly(0.7, -200, 4);

      expect(resultQuarter.stake).toBeLessThan(resultHalf.stake);
      expect(resultQuarter.fractionalKelly).toBeLessThan(resultHalf.fractionalKelly);
    });

    it('should calculate stake based on bankroll', () => {
      const result = calculateKelly(0.7, -200, 2);

      expect(result.stake).toBeGreaterThan(0);
      expect(result.expectedValue).toBeDefined();
    });

    it('should handle positive American odds', () => {
      const result = calculateKelly(0.4, 200, 2);

      expect(result.edge).toBeGreaterThan(0);
      expect(result.stake).toBeGreaterThan(0);
    });

    it('should not allow negative stake', () => {
      const result = calculateKelly(0.1, -200, 2);

      expect(result.stake).toBeGreaterThanOrEqual(0);
    });
  });

  describe('initBankroll', () => {
    it('should initialize a bankroll object', () => {
      const result = initBankroll(10000);
      
      expect(result).toBeDefined();
      expect(result.start_balance).toBe(10000);
      expect(result.current_balance).toBe(10000);
      expect(typeof result.total_wagered).toBe('number');
    });
  });

  describe('getBankroll', () => {
    it('should return a bankroll object', () => {
      const result = getBankroll();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('current_balance');
    });
  });

  describe('getOpenBets', () => {
    it('should return an array', () => {
      const result = getOpenBets();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getBetHistory', () => {
    it('should return an array', () => {
      const result = getBetHistory(50);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getBetStats', () => {
    it('should return statistics object', () => {
      const result = getBetStats();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('total_bets');
      expect(result).toHaveProperty('won_bets');
      expect(result).toHaveProperty('lost_bets');
      expect(result).toHaveProperty('win_rate');
      expect(typeof result.total_bets).toBe('number');
    });
  });

  describe('resetPaperTrading', () => {
    it('should execute without error', () => {
      expect(() => resetPaperTrading()).not.toThrow();
    });
  });
});
