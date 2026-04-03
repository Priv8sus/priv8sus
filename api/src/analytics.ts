import { getDb } from './db.js';

export type EventType = 'user_signup' | 'user_login' | 'prediction_viewed' | 'paper_trade_placed' | 'premium_upgrade' | 'premium_cancelled';

export interface AnalyticsEvent {
  id?: number;
  event_type: EventType;
  user_id?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Track an analytics event for a user.
 * @param eventType - Type of event to track
 * @param userId - Optional user ID associated with the event
 * @param metadata - Optional additional event metadata
 */
export function trackEvent(eventType: EventType, userId?: number, metadata?: Record<string, any>): void {
  const db = getDb();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  db.prepare(`
    INSERT INTO events (event_type, user_id, metadata, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(eventType, userId ?? null, metadataJson);
}

/**
 * Get count of unique active users on a specific date.
 * @param date - Date in YYYY-MM-DD format
 * @returns Number of unique users who performed an activity
 */
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

/**
 * Get count of user signups since a given date.
 * @param since - Date in YYYY-MM-DD format
 * @returns Number of signups since the date
 */
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

/**
 * Get count of paper trades placed since a given date.
 * @param since - Optional date filter in YYYY-MM-DD format
 * @returns Number of paper trades
 */
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

/**
 * Calculate user retention rate for a given day cohort.
 * @param day - Cohort period (1, 7, or 30 days)
 * @returns Retention statistics including retained count, total, and rate
 */
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

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  hasViewedToday: boolean;
  badges: string[];
}

/**
 * Get streak information for a user including current streak, longest streak, and badges.
 * @param userId - User ID to get streak info for
 * @returns StreakInfo object with current/longest streak, last activity, and badges
 */
export function getStreakInfo(userId: number): StreakInfo {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  const streakRow = db.prepare(`
    SELECT current_streak, longest_streak, last_activity_date
    FROM user_streaks WHERE user_id = ?
  `).get(userId) as { current_streak: number; longest_streak: number; last_activity_date: string } | undefined;

  if (!streakRow) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      hasViewedToday: false,
      badges: []
    };
  }

  const hasViewedToday = streakRow.last_activity_date === today;
  const badges = getStreakBadges(streakRow.current_streak);

  return {
    currentStreak: streakRow.current_streak,
    longestStreak: streakRow.longest_streak,
    lastActivityDate: streakRow.last_activity_date,
    hasViewedToday,
    badges
  };
}

function getStreakBadges(streak: number): string[] {
  const badges: string[] = [];
  if (streak >= 7) badges.push('7-day');
  if (streak >= 30) badges.push('30-day');
  if (streak >= 100) badges.push('100-day');
  return badges;
}

/**
 * Record a user activity and update their streak if applicable.
 * @param userId - User ID
 * @param activityType - Type of activity (default: 'prediction_view')
 */
export function recordActivity(userId: number, activityType: string = 'prediction_view'): void {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  db.prepare(`
    INSERT OR IGNORE INTO user_activity (user_id, activity_date, activity_type)
    VALUES (?, ?, ?)
  `).run(userId, today, activityType);

  const existingStreak = db.prepare(`SELECT * FROM user_streaks WHERE user_id = ?`).get(userId) as any;
  
  if (!existingStreak) {
    db.prepare(`
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_started_at)
      VALUES (?, 1, 1, ?, ?)
    `).run(userId, today, today);
    return;
  }

  const lastDate = existingStreak.last_activity_date;
  if (lastDate === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    const newStreak = existingStreak.current_streak + 1;
    const newLongest = Math.max(newStreak, existingStreak.longest_streak);
    db.prepare(`
      UPDATE user_streaks 
      SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(newStreak, newLongest, today, userId);
  } else {
    db.prepare(`
      UPDATE user_streaks 
      SET current_streak = 1, last_activity_date = ?, streak_started_at = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(today, today, userId);
  }
}

/**
 * Get list of user's favorite teams.
 * @param userId - User ID
 * @returns Array of team abbreviations
 */
export function getFavoriteTeams(userId: number): string[] {
  const db = getDb();
  const rows = db.prepare(`SELECT team_abbreviation FROM favorite_teams WHERE user_id = ?`).all(userId) as { team_abbreviation: string }[];
  return rows.map(r => r.team_abbreviation);
}

/**
 * Add a team to user's favorites.
 * @param userId - User ID
 * @param teamAbbrev - Team abbreviation to add
 */
export function addFavoriteTeam(userId: number, teamAbbrev: string): void {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO favorite_teams (user_id, team_abbreviation) VALUES (?, ?)`).run(userId, teamAbbrev);
}

/**
 * Remove a team from user's favorites.
 * @param userId - User ID
 * @param teamAbbrev - Team abbreviation to remove
 */
export function removeFavoriteTeam(userId: number, teamAbbrev: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM favorite_teams WHERE user_id = ? AND team_abbreviation = ?`).run(userId, teamAbbrev);
}

export function getReferralStats(since: string): { totalReferrals: number; convertedReferrals: number; conversionRate: number } {
  const db = getDb();
  const result = db.prepare(`
    SELECT 
      COUNT(DISTINCT u.id) as total_referrals,
      COUNT(DISTINCT CASE WHEN e.event_type = 'paper_trade_placed' THEN u.id END) as converted_referrals
    FROM users u
    LEFT JOIN events e ON u.id = e.user_id
    WHERE u.referrer_id IS NOT NULL
    AND DATE(u.created_at) >= DATE(?)
  `).get(since) as { total_referrals: number; converted_referrals: number };

  const totalReferrals = result?.total_referrals ?? 0;
  const convertedReferrals = result?.converted_referrals ?? 0;
  return {
    totalReferrals,
    convertedReferrals,
    conversionRate: totalReferrals > 0 ? convertedReferrals / totalReferrals : 0
  };
}

export function getConversionFunnel(startDate: string): { waitlist: number; signups: number; predictions: number; referrals: number; conversions: number } {
  const db = getDb();
  
  const waitlistResult = db.prepare(`
    SELECT COUNT(*) as count FROM subscribers WHERE DATE(subscribed_at) >= DATE(?)
  `).get(startDate) as { count: number };

  const signupsResult = db.prepare(`
    SELECT COUNT(*) as count FROM events WHERE event_type = 'user_signup' AND DATE(created_at) >= DATE(?)
  `).get(startDate) as { count: number };

  const predictionsResult = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM events WHERE event_type = 'paper_trade_placed' AND DATE(created_at) >= DATE(?)
  `).get(startDate) as { count: number };

  const referralsResult = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE referrer_id IS NOT NULL AND DATE(created_at) >= DATE(?)
  `).get(startDate) as { count: number };

  const conversionsResult = db.prepare(`
    SELECT COUNT(DISTINCT u.id) as count FROM users u
    JOIN events e ON u.id = e.user_id AND e.event_type = 'paper_trade_placed'
    WHERE u.referrer_id IS NOT NULL AND DATE(u.created_at) >= DATE(?)
  `).get(startDate) as { count: number };

  return {
    waitlist: waitlistResult?.count ?? 0,
    signups: signupsResult?.count ?? 0,
    predictions: predictionsResult?.count ?? 0,
    referrals: referralsResult?.count ?? 0,
    conversions: conversionsResult?.count ?? 0
  };
}

export function getWaitlistToSignupRate(): { waitlistCount: number; signupCount: number; conversionRate: number } {
  const db = getDb();
  const waitlistCount = db.prepare(`SELECT COUNT(*) as count FROM subscribers`).get() as { count: number };
  const signupCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE event_type = 'user_signup'`).get() as { count: number };
  const wc = waitlistCount?.count ?? 0;
  const sc = signupCount?.count ?? 0;
  return {
    waitlistCount: wc,
    signupCount: sc,
    conversionRate: wc > 0 ? sc / wc : 0
  };
}