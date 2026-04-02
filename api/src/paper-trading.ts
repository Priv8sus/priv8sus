import { getDb } from './db.js';
import { trackEvent } from './analytics.js';
import { logger } from './utils/logging.js';

export interface PaperBet {
  id: number;
  player_id: number;
  player_name: string;
  team_abbrev: string;
  game_date: string;
  stat_type: 'pts' | 'reb' | 'ast';
  line: number;
  over_or_under: 'over' | 'under';
  odds: number;
  stake: number;
  edge: number;
  probability: number;
  potential_payout: number;
  status: 'open' | 'won' | 'lost';
  actual_value: number | null;
  profit_loss: number | null;
  settled_at: string | null;
  created_at: string;
}

export interface Bankroll {
  id: number;
  start_balance: number;
  current_balance: number;
  total_wagered: number;
  total_profit_loss: number;
  win_rate: number;
  roi: number;
  updated_at: string;
}

export interface KellyBet {
  probability: number;
  odds: number;
  fractionalKelly: number;
  stake: number;
  edge: number;
  expectedValue: number;
}

const DEFAULT_START_BALANCE = 10000;
const KELLY_DIVISOR = 2;

export function initBankroll(startBalance: number = DEFAULT_START_BALANCE): Bankroll {
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM bankroll ORDER BY id DESC LIMIT 1').get() as Bankroll | undefined;
  if (existing) {
    return existing;
  }

  const result = db.prepare(`
    INSERT INTO bankroll (start_balance, current_balance, total_wagered, total_profit_loss, win_rate, roi)
    VALUES (?, ?, 0, 0, 0, 0)
  `).run(startBalance, startBalance);

  logger.info('Initialized paper trading bankroll', { startBalance });

  return {
    id: result.lastInsertRowid as number,
    start_balance: startBalance,
    current_balance: startBalance,
    total_wagered: 0,
    total_profit_loss: 0,
    win_rate: 0,
    roi: 0,
    updated_at: new Date().toISOString()
  };
}

export function getBankroll(): Bankroll | null {
  const db = getDb();
  const bankroll = db.prepare('SELECT * FROM bankroll ORDER BY id DESC LIMIT 1').get() as Bankroll | undefined;
  return bankroll || null;
}

export function calculateKelly(probability: number, odds: number, divisor: number = KELLY_DIVISOR): KellyBet {
  const decimalOdds = odds > 0 ? (odds / 100) + 1 : 1 - (100 / odds);
  const edge = probability - (1 / decimalOdds);
  const fractionalKelly = edge / (decimalOdds - 1);
  const bankroll = getBankroll()?.current_balance || DEFAULT_START_BALANCE;
  const stake = (fractionalKelly / divisor) * bankroll;
  const expectedValue = (probability * decimalOdds * stake) - stake;

  return {
    probability,
    odds,
    fractionalKelly: fractionalKelly / divisor,
    stake: Math.max(0, stake),
    edge,
    expectedValue
  };
}

export function placeBet(
  playerId: number,
  playerName: string,
  teamAbbrev: string,
  gameDate: string,
  statType: string,
  line: number,
  overOrUnder: 'over' | 'under',
  odds: number,
  stake: number,
  edge: number,
  probability: number
): PaperBet {
  const db = getDb();
  
  const potentialPayout = stake * (odds > 0 ? odds / 100 : 100 / Math.abs(odds));

  const result = db.prepare(`
    INSERT INTO paper_bets 
    (player_id, player_name, team_abbrev, game_date, stat_type, line, over_or_under, odds, stake, edge, probability, potential_payout, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(playerId, playerName, teamAbbrev, gameDate, statType, line, overOrUnder, odds, stake, edge, probability, potentialPayout);

  db.prepare(`
    UPDATE bankroll SET 
      current_balance = current_balance - ?,
      total_wagered = total_wagered + ?,
      updated_at = datetime('now')
    WHERE id = (SELECT id FROM bankroll ORDER BY id DESC LIMIT 1)
  `).run(stake, stake);

  const bet = db.prepare('SELECT * FROM paper_bets WHERE id = ?').get(result.lastInsertRowid) as PaperBet;

  logger.info('Placed paper bet', { betId: bet.id, playerName, statType, line, stake });

  trackEvent('paper_trade_placed', undefined, {
    bet_id: bet.id,
    player_id: playerId,
    player_name: playerName,
    stat_type: statType,
    line,
    stake,
    edge,
    probability
  });

  return bet;
}

export function settleBet(betId: number, actualValue: number): PaperBet | null {
  const db = getDb();
  
  const bet = db.prepare('SELECT * FROM paper_bets WHERE id = ?').get(betId) as PaperBet | undefined;
  if (!bet || bet.status !== 'open') {
    logger.warn('Bet not found or already settled', { betId });
    return null;
  }

  const won = bet.over_or_under === 'over' 
    ? actualValue > bet.line 
    : actualValue < bet.line;

  const profitLoss = won ? bet.potential_payout - bet.stake : -bet.stake;

  db.prepare(`
    UPDATE paper_bets SET 
      status = ?,
      actual_value = ?,
      profit_loss = ?,
      settled_at = datetime('now')
    WHERE id = ?
  `).run(won ? 'won' : 'lost', actualValue, profitLoss, betId);

  db.prepare(`
    UPDATE bankroll SET 
      current_balance = current_balance + ? + ?,
      updated_at = datetime('now')
    WHERE id = (SELECT id FROM bankroll ORDER BY id DESC LIMIT 1)
  `).run(bet.stake, profitLoss);

  const settledBet = db.prepare('SELECT * FROM paper_bets WHERE id = ?').get(betId) as PaperBet;
  
  logger.info('Settled paper bet', { betId, won, actualValue, profitLoss });
  
  return settledBet;
}

export function getOpenBets(): PaperBet[] {
  const db = getDb();
  return db.prepare('SELECT * FROM paper_bets WHERE status = \'open\' ORDER BY created_at DESC').all() as PaperBet[];
}

export function getBetHistory(limit: number = 50): PaperBet[] {
  const db = getDb();
  return db.prepare('SELECT * FROM paper_bets WHERE status != \'open\' ORDER BY settled_at DESC LIMIT ?').all(limit) as PaperBet[];
}

export function getBetStats(): {
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pending_bets: number;
  win_rate: number;
  total_profit_loss: number;
  roi: number;
} {
  const db = getDb();
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_bets,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won_bets,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_bets,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as pending_bets,
      SUM(CASE WHEN status = 'won' THEN profit_loss ELSE 0 END) as total_wins,
      SUM(CASE WHEN status = 'lost' THEN profit_loss ELSE 0 END) as total_losses
    FROM paper_bets
  `).get() as any;

  const winRate = stats.won_bets > 0 ? stats.won_bets / (stats.won_bets + stats.lost_bets) * 100 : 0;
  const totalProfitLoss = (stats.total_wins || 0) + (stats.total_losses || 0);
  const bankroll = getBankroll();
  const roi = bankroll && bankroll.total_wagered > 0 
    ? (totalProfitLoss / bankroll.total_wagered) * 100 
    : 0;

  return {
    total_bets: stats.total_bets || 0,
    won_bets: stats.won_bets || 0,
    lost_bets: stats.lost_bets || 0,
    pending_bets: stats.pending_bets || 0,
    win_rate: Math.round(winRate * 100) / 100,
    total_profit_loss: Math.round(totalProfitLoss * 100) / 100,
    roi: Math.round(roi * 100) / 100
  };
}

export function resetPaperTrading(): void {
  const db = getDb();
  
  db.prepare('DELETE FROM paper_bets').run();
  
  const bankroll = getBankroll();
  if (bankroll) {
    db.prepare(`
      UPDATE bankroll SET 
        current_balance = start_balance,
        total_wagered = 0,
        total_profit_loss = 0,
        win_rate = 0,
        roi = 0,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(bankroll.id);
  }
  
  logger.info('Paper trading reset');
}

export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  }
  return 1 - (100 / americanOdds);
}

export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return (decimalOdds - 1) * 100;
  }
  return -100 / (decimalOdds - 1);
}

export function probabilityToAmerican(probability: number): number {
  if (probability >= 0.5) {
    return -100 / probability + 100;
  }
  return 100 / (1 - probability);
}

export function americanToProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  }
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
}
