import { getDb } from './db.js';

export type EventType = 'user_signup' | 'user_login' | 'prediction_viewed' | 'paper_trade_placed' | 'premium_upgrade' | 'premium_cancelled';

export interface AnalyticsEvent {
  id?: number;
  event_type: EventType;
  user_id?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export function trackEvent(eventType: EventType, userId?: number, metadata?: Record<string, any>): void {
  const db = getDb();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  db.prepare(`
    INSERT INTO events (event_type, user_id, metadata, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(eventType, userId ?? null, metadataJson);
}

export function getDailyActiveUsers(date: string): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM events
    WHERE DATE(created_at) = DATE(?)
    AND user_id IS NOT NULL
  `).get(date) as { count: number };
  return result?.count ?? 0;
}

export function getSignupsSince(since: string): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM events
    WHERE event_type = 'user_signup'
    AND DATE(created_at) >= DATE(?)
  `).get(since) as { count: number };
  return result?.count ?? 0;
}

export function getPaperTradesCount(since?: string): number {
  const db = getDb();
  let query = `SELECT COUNT(*) as count FROM events WHERE event_type = 'paper_trade_placed'`;
  const params: any[] = [];
  if (since) {
    query += ` AND DATE(created_at) >= DATE(?)`;
    params.push(since);
  }
  const result = db.prepare(query).get(...params) as { count: number };
  return result?.count ?? 0;
}

export function getRetentionStats(day: 1 | 7 | 30): { retained: number; total: number; rate: number } {
  const db = getDb();
  const since = day === 1 ? 1 : day === 7 ? 7 : 30;
  const result = db.prepare(`
    WITH signups AS (
      SELECT user_id, DATE(created_at) as signup_date
      FROM events
      WHERE event_type = 'user_signup'
      AND DATE(created_at) >= DATE('now', '-${since + 1} days')
    ),
    retained AS (
      SELECT COUNT(DISTINCT s.user_id) as count
      FROM signups s
      JOIN events e ON s.user_id = e.user_id
      AND DATE(e.created_at) > s.signup_date
      AND DATE(e.created_at) <= DATE(s.signup_date, '+${since} days')
    )
    SELECT
      (SELECT COUNT(*) FROM signups) as total,
      (SELECT count FROM retained) as retained
  `).get() as { total: number; retained: number };
  const retained = result?.retained ?? 0;
  const total = result?.total ?? 0;
  return { retained, total, rate: total > 0 ? retained / total : 0 };
}