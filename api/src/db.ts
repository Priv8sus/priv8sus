import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database;

/**
 * Get the singleton database instance.
 * Initializes the database on first call.
 * @returns SQLite database instance
 */
export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "predictions.db");
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      team_id INTEGER,
      team_abbreviation TEXT,
      position TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS season_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      games_played INTEGER DEFAULT 0,
      min_avg REAL DEFAULT 0,
      pts_avg REAL DEFAULT 0,
      reb_avg REAL DEFAULT 0,
      ast_avg REAL DEFAULT 0,
      stl_avg REAL DEFAULT 0,
      blk_avg REAL DEFAULT 0,
      fg_pct REAL DEFAULT 0,
      fg3_pct REAL DEFAULT 0,
      ft_pct REAL DEFAULT 0,
      turnover_avg REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, season)
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      game_date TEXT NOT NULL,
      predicted_pts REAL NOT NULL,
      predicted_reb REAL NOT NULL,
      predicted_ast REAL NOT NULL,
      predicted_stl REAL NOT NULL,
      predicted_blk REAL NOT NULL,
      predicted_threes REAL NOT NULL,
      confidence REAL NOT NULL,
      actual_pts REAL,
      actual_reb REAL,
      actual_ast REAL,
      actual_stl REAL,
      actual_blk REAL,
      actual_threes REAL,
      accuracy_score REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS betting_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      game_date TEXT NOT NULL,
      stat_type TEXT NOT NULL,
      line_value REAL NOT NULL,
      over_prob REAL,
      under_prob REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY,
      date TEXT NOT NULL,
      home_team_id INTEGER,
      home_team_name TEXT,
      home_team_score INTEGER,
      visitor_team_id INTEGER,
      visitor_team_name TEXT,
      visitor_team_score INTEGER,
      season INTEGER,
      status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      game_date TEXT NOT NULL,
      injury_status TEXT,
      injury_detail TEXT,
      is_back_to_back INTEGER DEFAULT 0,
      rest_days INTEGER DEFAULT 0,
      recent_news_summary TEXT,
      condition_score REAL DEFAULT 0,
      data_sources TEXT,
      scraped_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, game_date)
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_game_date ON predictions(game_date);
    CREATE INDEX IF NOT EXISTS idx_predictions_player_id ON predictions(player_id);
    CREATE INDEX IF NOT EXISTS idx_season_stats_player_id ON season_stats(player_id);
    CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
    CREATE INDEX IF NOT EXISTS idx_betting_lines_player_date ON betting_lines(player_id, game_date);
    CREATE INDEX IF NOT EXISTS idx_player_conditions_date ON player_conditions(game_date);
    CREATE INDEX IF NOT EXISTS idx_player_conditions_player ON player_conditions(player_id);

    CREATE TABLE IF NOT EXISTS bankroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_balance REAL NOT NULL,
      current_balance REAL NOT NULL,
      total_wagered REAL DEFAULT 0,
      total_profit_loss REAL DEFAULT 0,
      win_rate REAL DEFAULT 0,
      roi REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS paper_bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      team_abbrev TEXT,
      game_date TEXT NOT NULL,
      stat_type TEXT NOT NULL,
      line REAL NOT NULL,
      over_or_under TEXT NOT NULL,
      odds INTEGER NOT NULL,
      stake REAL NOT NULL,
      edge REAL NOT NULL,
      probability REAL NOT NULL,
      potential_payout REAL NOT NULL,
      status TEXT DEFAULT 'open',
      actual_value REAL,
      profit_loss REAL,
      settled_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scoring_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_date TEXT NOT NULL,
      stat_type TEXT NOT NULL,
      total_predictions INTEGER DEFAULT 0,
      mae REAL DEFAULT 0,
      rmse REAL DEFAULT 0,
      calibration_score REAL DEFAULT 0,
      avg_confidence REAL DEFAULT 0,
      computed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(game_date, stat_type)
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      total_predictions INTEGER DEFAULT 0,
      overall_mae REAL DEFAULT 0,
      overall_rmse REAL DEFAULT 0,
      overall_calibration REAL DEFAULT 0,
      best_stat_type TEXT,
      worst_stat_type TEXT,
      report_json TEXT,
      generated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(week_start, week_end)
    );

    CREATE INDEX IF NOT EXISTS idx_scoring_date ON scoring_results(game_date);
    CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start);

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      subscribed_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active',
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      subscription_tier TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      user_id INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

    CREATE TABLE IF NOT EXISTS user_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      streak_started_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_date TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, activity_date, activity_type)
    );

    CREATE TABLE IF NOT EXISTS favorite_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      team_abbreviation TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, team_abbreviation)
    );

    CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(activity_date);
    CREATE INDEX IF NOT EXISTS idx_favorite_teams_user ON favorite_teams(user_id);

    CREATE TABLE IF NOT EXISTS email_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email_type TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      resend_message_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_scheduled ON email_jobs(scheduled_for);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_user ON email_jobs(user_id);

    CREATE TABLE IF NOT EXISTS email_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email_type TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_email_events_user ON email_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(email_type);
  `);
}

export function migrateUsersTable(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasTier = cols.some(c => c.name === 'subscription_tier');
  if (!hasTier) {
    db.exec(`
      ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
      ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
      ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
    `);
  }

  const hasUnsubscribed = cols.some(c => c.name === 'email_unsubscribed');
  if (!hasUnsubscribed) {
    db.exec(`ALTER TABLE users ADD COLUMN email_unsubscribed INTEGER DEFAULT 0`);
  }

  const hasOnboardingCompleted = cols.some(c => c.name === 'onboarding_completed');
  if (!hasOnboardingCompleted) {
    db.exec(`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0`);
  }

  const hasFirstLoginAt = cols.some(c => c.name === 'first_login_at');
  if (!hasFirstLoginAt) {
    db.exec(`ALTER TABLE users ADD COLUMN first_login_at TEXT`);
  }

  const hasTourCompleted = cols.some(c => c.name === 'tour_completed');
  if (!hasTourCompleted) {
    db.exec(`ALTER TABLE users ADD COLUMN tour_completed INTEGER DEFAULT 0`);
  }
}

// Export for direct use
export function initDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath || process.env.DB_PATH || path.join(process.cwd(), "data", "predictions.db");
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  return db;
}
