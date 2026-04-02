import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase, migrateUsersTable } from "./db.js";
import { getGames, getTeamRoster, getSeasonAverages, BDLPlayer, BDLSeasonAverage, searchPlayers, isUsingFallback, getFallbackReason } from "./unified-nba-api.js";
import { generatePredictions, rankPlayersByImpact, StatPrediction } from "./predictions.js";
import { ingestToday, ingestPlayers, ingestHistoricalStats } from "./ingestion.js";
import {
  createPlayerProfile,
  calculateAllLineProbabilities,
  findBestBets,
} from "./probability-model.js";
import { logger } from "./utils/logging.js";
import { validateEnv, EnvConfig } from "./env.js";
import { errorTrackingMiddleware, getRecentErrors, getErrorStats, clearErrors } from "./error-tracking.js";
import {
  initBankroll,
  getBankroll,
  calculateKelly,
  placeBet,
  settleBet,
  getOpenBets,
  getBetHistory,
  getBetStats,
  resetPaperTrading,
  probabilityToAmerican,
  TYPICAL_PROP_ODDS,
} from "./paper-trading.js";
import { trackEvent, getDailyActiveUsers, getSignupsSince, getPaperTradesCount, getRetentionStats, getStreakInfo, recordActivity, getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from "./analytics.js";
import { sendWelcomeEmail, queueEmail, processEmailQueue, recordEmailOpen, unsubscribeUser, sendDailyDigestToAllUsers } from "./email-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let config: EnvConfig;
try {
  config = validateEnv();
  logger.setLevel(config.LOG_LEVEL);
  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'priv8sus-dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be changed from default value in production');
  }
} catch (error) {
  console.error('Failed to validate environment:', error);
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

app.use(express.json());
app.use(errorTrackingMiddleware);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

// Serve React frontend in production
const frontendPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendPath));

const db = initDatabase();
migrateUsersTable(db);

// Process email queue every minute
setInterval(() => {
  if (process.env.RESEND_API_KEY) {
    processEmailQueue().catch(err => logger.error('Email queue error:', err));
  }
}, 60000);

// Cache for predictions (refresh every 10 minutes)
let predictionCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/monitoring/errors", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const errors = getRecentErrors(limit);
  res.json({ errors, count: errors.length });
});

app.get("/api/monitoring/error-stats", (req, res) => {
  const stats = getErrorStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
    healthy: stats.last24h < 100,
  });
});

app.post("/api/monitoring/errors/clear", (req, res) => {
  clearErrors();
  logger.info('Error logs cleared by admin');
  res.json({ success: true, message: 'Error logs cleared' });
});

app.get("/api/email/track/:trackingId", async (req, res) => {
  await recordEmailOpen(req.params.trackingId);
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

app.post("/api/email/unsubscribe", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const success = await unsubscribeUser(parseInt(userId));
    if (success) {
      res.json({ success: true, message: "Unsubscribed successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    logger.error("Unsubscribe error:", err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

app.get("/api/email/unsubscribe", async (req, res) => {
  const userId = req.query.uid as string;
  if (!userId) {
    return res.redirect('/?unsubscribe=error');
  }
  await unsubscribeUser(parseInt(userId));
  res.redirect('/?unsubscribe=success');
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.post("/api/subscribe", (req, res) => {
  try {
    const { email, source } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = db.prepare("SELECT id, status FROM subscribers WHERE email = ?").get(normalizedEmail) as any;
    
    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({ error: "Email already subscribed", message: "This email is already subscribed to our newsletter" });
      }
      db.prepare("UPDATE subscribers SET status = 'active', subscribed_at = datetime('now') WHERE email = ?").run(normalizedEmail);
      return res.json({ success: true, message: "Subscription reactivated" });
    }

    const result = db.prepare("INSERT INTO subscribers (email, source) VALUES (?, ?)").run(normalizedEmail, source || 'website');
    
    logger.info(`New subscriber: ${normalizedEmail}`);
    res.status(201).json({ success: true, message: "Successfully subscribed to daily predictions", subscriberId: result.lastInsertRowid });
  } catch (err: any) {
    logger.error("Subscribe error", { error: err.message });
    res.status(500).json({ error: "Failed to process subscription" });
  }
});

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = config.JWT_SECRET;
const SALT_ROUNDS = 10;

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email already registered", message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(normalizedEmail, passwordHash);

    const userId = result.lastInsertRowid as number;
    const user = { id: userId, email: normalizedEmail, created_at: new Date().toISOString() };

    const token = jwt.sign(
      { userId, email: normalizedEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    if (process.env.RESEND_API_KEY) {
      sendWelcomeEmail(user).catch(err => logger.error('Welcome email error:', err));
      const day1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const day3 = new Date(Date.now() + 72 * 60 * 60 * 1000);
      queueEmail(userId, 'day1', day1).catch(err => logger.error('Queue day1 error:', err));
      queueEmail(userId, 'day3', day3).catch(err => logger.error('Queue day3 error:', err));
    }

    logger.info(`New user signup: ${normalizedEmail}`);
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: result.lastInsertRowid, email: normalizedEmail }
    });
  } catch (err: any) {
    logger.error("Signup error", { error: err.message });
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials", message: "Email or password is incorrect" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials", message: "Email or password is incorrect" });
    }

    const isFirstLogin = !user.first_login_at;
    if (isFirstLogin) {
      db.prepare("UPDATE users SET first_login_at = datetime('now') WHERE id = ?").run(user.id);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`User login: ${normalizedEmail}`);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { 
        id: user.id, 
        email: user.email,
        onboardingCompleted: user.onboarding_completed === 1,
        isFirstLogin
      }
    });
  } catch (err: any) {
    logger.error("Login error", { error: err.message });
    res.status(500).json({ error: "Failed to login" });
  }
});

interface AuthRequest extends express.Request {
  user?: { userId: number; email: string };
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = db.prepare(
      "SELECT id, email, subscription_tier, stripe_customer_id, created_at, onboarding_completed, first_login_at, tour_completed FROM users WHERE id = ?"
    ).get(req.user!.userId) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at,
        onboardingCompleted: user.onboarding_completed === 1,
        firstLoginAt: user.first_login_at,
        isFirstLogin: !user.first_login_at,
        tourCompleted: user.tour_completed === 1
      }
    });
  } catch (err: any) {
    logger.error("Get profile error", { error: err.message });
    res.status(500).json({ error: "Failed to get profile" });
  }
});

app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user!.userId;

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(normalizedEmail, userId);
      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }
      db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?").run(normalizedEmail, userId);
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, userId);
    }

    const user = db.prepare(
      "SELECT id, email, subscription_tier, created_at FROM users WHERE id = ?"
    ).get(userId) as any;

    res.json({
      success: true,
      message: "Profile updated",
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at
      }
    });
  } catch (err: any) {
    logger.error("Update profile error", { error: err.message });
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/api/auth/onboarding-complete", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    db.prepare("UPDATE users SET onboarding_completed = 1 WHERE id = ?").run(userId);
    res.json({ success: true, message: "Onboarding completed" });
  } catch (err: any) {
    logger.error("Onboarding complete error", { error: err.message });
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

app.post("/api/auth/tour-complete", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    db.prepare("UPDATE users SET tour_completed = 1 WHERE id = ?").run(userId);
    res.json({ success: true, message: "Tour completed" });
  } catch (err: any) {
    logger.error("Tour complete error", { error: err.message });
    res.status(500).json({ error: "Failed to complete tour" });
  }
});

app.get("/api/subscription", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = db.prepare(
      "SELECT id, email, subscription_tier, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?"
    ).get(req.user!.userId) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tiers = {
      free: {
        name: 'Free',
        price: 0,
        features: ['Daily email predictions', 'Paper trading', 'Basic predictions']
      },
      premium: {
        name: 'Premium',
        price: 29,
        priceId: process.env.STRIPE_PRICE_ID_MONTHLY,
        features: ['Everything in Free', 'Real-time predictions', 'Advanced analytics', 'Priority support']
      }
    };

    res.json({
      success: true,
      subscription: {
        tier: user.subscription_tier,
        stripeCustomerId: user.stripe_customer_id,
        stripeSubscriptionId: user.stripe_subscription_id,
        isActive: user.subscription_tier === 'premium',
        tiers
      }
    });
  } catch (err: any) {
    logger.error("Get subscription error", { error: err.message });
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

app.post("/api/subscription/checkout", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { priceId } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.userId) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Payment processing not configured" });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: String(user.id) }
      });
      customerId = customer.id;
      db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?subscription=cancelled`,
      metadata: { userId: String(user.id) }
    });

    res.json({ success: true, checkoutUrl: session.url });
  } catch (err: any) {
    logger.error("Checkout error", { error: err.message });
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sig = req.headers['stripe-signature'] as string;
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logger.error("Webhook signature verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          db.prepare(
            "UPDATE users SET subscription_tier = 'premium', stripe_subscription_id = ?, updated_at = datetime('now') WHERE id = ?"
          ).run(session.subscription, userId);
          trackEvent('premium_upgrade', parseInt(userId), { subscription_id: session.subscription });
          logger.info(`User ${userId} upgraded to premium`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = db.prepare("SELECT id FROM users WHERE stripe_subscription_id = ?").get(subscription.id) as { id: number } | undefined;
        db.prepare(
          "UPDATE users SET subscription_tier = 'free', stripe_subscription_id = NULL, updated_at = datetime('now') WHERE stripe_subscription_id = ?"
        ).run(subscription.id);
        if (user) {
          trackEvent('premium_cancelled', user.id, { subscription_id: subscription.id });
        }
        logger.info(`Subscription ${subscription.id} cancelled`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.warn(`Payment failed for customer ${invoice.customer}`);
        break;
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    logger.error("Webhook handler error", { error: err.message });
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

app.get("/api/analytics/daily-active-users", (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  try {
    const count = getDailyActiveUsers(date);
    res.json({ date, daily_active_users: count });
  } catch (err: any) {
    logger.error("Daily active users error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/signups", (req, res) => {
  const since = (req.query.since as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    const count = getSignupsSince(since);
    res.json({ since, signups: count });
  } catch (err: any) {
    logger.error("Signups query error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/retention", (req, res) => {
  const day = parseInt(req.query.day as string) || 1;
  if (![1, 7, 30].includes(day)) {
    return res.status(400).json({ error: "day must be 1, 7, or 30" });
  }
  try {
    const stats = getRetentionStats(day as 1 | 7 | 30);
    res.json({ day, ...stats });
  } catch (err: any) {
    logger.error("Retention query error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/paper-trades", (req, res) => {
  const since = req.query.since as string | undefined;
  try {
    const count = getPaperTradesCount(since);
    res.json({ since: since || 'all', paper_trades: count });
  } catch (err: any) {
    logger.error("Paper trades query error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/analytics/track", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { event_type, metadata } = req.body;
    if (!event_type) {
      return res.status(400).json({ error: "event_type is required" });
    }
    const validEventTypes = ['user_signup', 'user_login', 'prediction_viewed', 'paper_trade_placed', 'premium_upgrade', 'premium_cancelled'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({ error: "Invalid event_type" });
    }
    trackEvent(event_type, req.user!.userId, metadata);
    res.json({ success: true });
  } catch (err: any) {
    logger.error("Track event error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/streaks", authenticateToken, (req: AuthRequest, res) => {
  try {
    const streakInfo = getStreakInfo(req.user!.userId);
    res.json({ success: true, streak: streakInfo });
  } catch (err: any) {
    logger.error("Get streak error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/streaks/record", authenticateToken, (req: AuthRequest, res) => {
  try {
    const activityType = req.body.activityType || 'prediction_view';
    recordActivity(req.user!.userId, activityType);
    const streakInfo = getStreakInfo(req.user!.userId);
    res.json({ success: true, streak: streakInfo });
  } catch (err: any) {
    logger.error("Record streak error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/favorite-teams", authenticateToken, (req: AuthRequest, res) => {
  try {
    const teams = getFavoriteTeams(req.user!.userId);
    res.json({ success: true, teams });
  } catch (err: any) {
    logger.error("Get favorite teams error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/favorite-teams", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { teamAbbreviation } = req.body;
    if (!teamAbbreviation) {
      return res.status(400).json({ error: "teamAbbreviation is required" });
    }
    addFavoriteTeam(req.user!.userId, teamAbbreviation.toUpperCase());
    const teams = getFavoriteTeams(req.user!.userId);
    res.json({ success: true, teams });
  } catch (err: any) {
    logger.error("Add favorite team error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/favorite-teams/:team", authenticateToken, (req: AuthRequest, res) => {
  try {
    const teamAbbrev = req.params.team.toUpperCase();
    removeFavoriteTeam(req.user!.userId, teamAbbrev);
    const teams = getFavoriteTeams(req.user!.userId);
    res.json({ success: true, teams });
  } catch (err: any) {
    logger.error("Remove favorite team error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/digest/send", async (req: express.Request, res: express.Response) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const gameDate = req.query.date as string || new Date().toISOString().split('T')[0];
    
    const gamesRes = await getGames(gameDate);
    const games = gamesRes.data;

    if (games.length === 0) {
      return res.status(404).json({ error: "No games scheduled", message: "No games for today" });
    }

    const teamIds = new Set<number>();
    games.forEach((g: any) => {
      teamIds.add(g.home_team.id);
      teamIds.add(g.visitor_team.id);
    });

    const players = await getTeamRoster([...teamIds]);
    const playersWithPosition = players.filter((p: any) => p.position);

    const seasonAverages = new Map<number, BDLSeasonAverage>();
    const fetchLimit = Math.min(playersWithPosition.length, 50);

    for (let i = 0; i < fetchLimit; i++) {
      try {
        const avg = await getSeasonAverages(playersWithPosition[i].id);
        if (avg) seasonAverages.set(playersWithPosition[i].id, avg);
        if (i % 5 === 4) await new Promise((r: any) => setTimeout(r, 200));
      } catch (e: any) {
        logger.warn(`Skipping player ${playersWithPosition[i].id} due to error: ${e.message}`);
      }
    }

    const result = generatePredictions(playersWithPosition, seasonAverages, gameDate);
    const topPredictions = result.topPlayers;

    const yesterdayRows = db.prepare(`
      SELECT AVG(ABS(actual_pts - predicted_pts)) as pts_mae,
             AVG(ABS(actual_reb - predicted_reb)) as reb_mae,
             AVG(ABS(actual_ast - predicted_ast)) as ast_mae
      FROM predictions WHERE game_date = ? AND actual_pts IS NOT NULL
    `).get(yesterdayStr) as any;

    const yesterdayAccuracy = yesterdayRows ? {
      ptsMAE: yesterdayRows.pts_mae,
      rebMAE: yesterdayRows.reb_mae,
      astMAE: yesterdayRows.ast_mae
    } : null;

    const { sent, failed } = await sendDailyDigestToAllUsers(topPredictions, yesterdayAccuracy);
    
    res.json({ success: true, digestSent: sent, digestFailed: failed });
  } catch (err: any) {
    logger.error("Send digest error", { error: err.message });
    res.status(500).json({ error: "Failed to send digest" });
  }
});

app.get("/api/predictions", async (req, res) => {
  const gameDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
  try {
    // Return cache if fresh
    if (predictionCache && Date.now() - predictionCache.timestamp < CACHE_TTL) {
      return res.json(predictionCache.data);
    }

    logger.info(`Fetching predictions for ${gameDate}...`);

    // 1. Get today's games
    const gamesRes = await getGames(gameDate);
    const games = gamesRes.data;

    if (games.length === 0) {
      const data = { gameDate, games: [], predictions: [], topPlayers: [], message: "No games scheduled for this date" };
      return res.json(data);
    }

    // 2. Get unique team IDs
    const teamIds = new Set<number>();
    games.forEach((g) => {
      teamIds.add(g.home_team.id);
      teamIds.add(g.visitor_team.id);
    });

    // 3. Fetch team rosters
    const players = await getTeamRoster([...teamIds]);
    logger.debug(`Fetched ${players.length} players from ${teamIds.size} teams`);

    // 4. Get season averages for top players (limit to avoid rate limiting)
    const seasonAverages = new Map<number, BDLSeasonAverage>();
    const playersToFetch = players.filter((p) => p.position); // Only active/rostered players

    // Batch fetch - limit to avoid API rate limits
    const fetchLimit = Math.min(playersToFetch.length, 80);
    for (let i = 0; i < fetchLimit; i++) {
      try {
        const avg = await getSeasonAverages(playersToFetch[i].id);
        if (avg) seasonAverages.set(playersToFetch[i].id, avg);
        // Small delay to be respectful
        if (i % 5 === 4) await new Promise((r) => setTimeout(r, 200));
      } catch (e: any) {
        logger.warn(`Skipping player ${playersToFetch[i].id} due to error: ${e.message}`);
      }
    }

    // 5. Generate predictions
    const result = generatePredictions(playersToFetch, seasonAverages, gameDate);

    // 6. Save predictions to DB
    const insertPred = db.prepare(`
      INSERT INTO predictions (player_id, game_date, predicted_pts, predicted_reb, predicted_ast, predicted_stl, predicted_blk, predicted_threes, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPlayer = db.prepare(`
      INSERT OR IGNORE INTO players (id, first_name, last_name, team_abbreviation, position)
      VALUES (?, ?, ?, ?, ?)
    `);

    const saveTx = db.transaction(() => {
      for (const pred of result.topPlayers) {
        const player = playersToFetch.find((p) => p.id === pred.playerId);
        if (player) {
          insertPlayer.run(player.id, player.first_name, player.last_name, player.team?.abbreviation || "", player.position || "");
        }
        insertPred.run(pred.playerId, gameDate, pred.predictedPts, pred.predictedReb, pred.predictedAst, pred.predictedStl, pred.predictedBlk, pred.predictedThrees, pred.confidence);
      }
    });
    saveTx();

    const responseData = {
      gameDate,
      games: games.map((g) => ({
        id: g.id,
        homeTeam: g.home_team.full_name,
        homeAbbr: g.home_team.abbreviation,
        visitorTeam: g.visitor_team.full_name,
        visitorAbbr: g.visitor_team.abbreviation,
        homeScore: g.home_team_score,
        visitorScore: g.visitor_team_score,
        status: g.status,
      })),
      predictions: result.predictions.slice(0, 50),
      topPlayers: result.topPlayers,
      totalPlayers: playersToFetch.length,
      totalWithStats: seasonAverages.size,
    };

    predictionCache = { data: responseData, timestamp: Date.now() };
    res.json(responseData);
  } catch (err: any) {
    logger.error("Prediction error", { error: err.message, gameDate });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/predictions", (req, res) => {
  try {
    const { player_id, game_date, predicted_pts, predicted_reb, predicted_ast, predicted_stl, predicted_blk, predicted_threes, confidence } = req.body;

    if (!player_id || !game_date || predicted_pts === undefined || predicted_reb === undefined || predicted_ast === undefined || predicted_stl === undefined || predicted_blk === undefined || predicted_threes === undefined || confidence === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = db.prepare(`
      INSERT INTO predictions (player_id, game_date, predicted_pts, predicted_reb, predicted_ast, predicted_stl, predicted_blk, predicted_threes, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(player_id, game_date, predicted_pts, predicted_reb, predicted_ast, predicted_stl, predicted_blk, predicted_threes, confidence);

    res.status(201).json({ id: result.lastInsertRowid, message: "Prediction created" });
  } catch (err: any) {
    logger.error("Create prediction error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/predictions/:id/result", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row = db.prepare(`
      SELECT p.*, pl.first_name, pl.last_name, pl.team_abbreviation, pl.position
      FROM predictions p
      LEFT JOIN players pl ON p.player_id = pl.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    const hasActualResults = row.actual_pts !== null || row.actual_reb !== null || row.actual_ast !== null;

    res.json({
      id: row.id,
      player_id: row.player_id,
      player_name: `${row.first_name} ${row.last_name}`,
      team: row.team_abbreviation,
      position: row.position,
      game_date: row.game_date,
      predicted: {
        pts: row.predicted_pts,
        reb: row.predicted_reb,
        ast: row.predicted_ast,
        stl: row.predicted_stl,
        blk: row.predicted_blk,
        threes: row.predicted_threes,
      },
      actual: hasActualResults ? {
        pts: row.actual_pts,
        reb: row.actual_reb,
        ast: row.actual_ast,
        stl: row.actual_stl,
        blk: row.actual_blk,
        threes: row.actual_threes,
      } : null,
      accuracy_score: row.accuracy_score,
      confidence: row.confidence,
      created_at: row.created_at,
      has_actual_results: hasActualResults,
    });
  } catch (err: any) {
    logger.error("Get prediction result error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/history", (_req, res) => {
  const rows = db.prepare(`
    SELECT p.*, pl.first_name, pl.last_name, pl.team_abbreviation, pl.position
    FROM predictions p
    LEFT JOIN players pl ON p.player_id = pl.id
    ORDER BY p.game_date DESC, p.predicted_pts DESC
    LIMIT 200
  `).all();
  res.json(rows);
});

function calculateMAE(actual: number, predicted: number): number {
  return Math.abs(actual - predicted);
}

function calculateCalibration(predicted: number, actual: number, threshold: number = 0.1): boolean {
  if (actual === 0) return Math.abs(predicted - actual) <= threshold;
  return Math.abs(predicted - actual) / actual <= threshold;
}

function calculateStatMAE(predictions: any[], stat: string): number {
  const validPredictions = predictions.filter(p => p[`actual_${stat}`] !== null && p[`actual_${stat}`] !== undefined);
  if (validPredictions.length === 0) return 0;
  const totalMAE = validPredictions.reduce((sum, p) => sum + calculateMAE(p[`actual_${stat}`], p[`predicted_${stat}`]), 0);
  return totalMAE / validPredictions.length;
}

function calculateStatCalibration(predictions: any[], stat: string, threshold: number = 0.1): number {
  const validPredictions = predictions.filter(p => p[`actual_${stat}`] !== null && p[`actual_${stat}`] !== undefined);
  if (validPredictions.length === 0) return 0;
  const correct = validPredictions.filter(p => calculateCalibration(p[`predicted_${stat}`], p[`actual_${stat}`], threshold)).length;
  return correct / validPredictions.length;
}

app.get("/api/predictions/score/:game_id", (req, res) => {
  try {
    const gameId = req.params.game_id;
    const threshold = parseFloat(req.query.threshold as string) || 0.1;

    const predictions = db.prepare(`
      SELECT * FROM predictions WHERE game_date = ?
    `).all(gameId) as any[];

    if (predictions.length === 0) {
      return res.status(404).json({ error: "No predictions found for this game date", game_date: gameId });
    }

    const predictionsWithResults = predictions.filter(p => 
      p.actual_pts !== null || p.actual_reb !== null || p.actual_ast !== null
    );

    if (predictionsWithResults.length === 0) {
      return res.json({
        game_date: gameId,
        total_predictions: predictions.length,
        has_actual_results: false,
        message: "No actual results recorded yet for this game date",
        scoring: null
      });
    }

    const statTypes = ['pts', 'reb', 'ast', 'stl', 'blk', 'threes'];
    const scoring: Record<string, any> = {};

    for (const stat of statTypes) {
      const mae = calculateStatMAE(predictionsWithResults, stat);
      const calibration = calculateStatCalibration(predictionsWithResults, stat, threshold);
      scoring[stat] = {
        mae: Math.round(mae * 1000) / 1000,
        calibration_within_10pct: Math.round(calibration * 1000) / 1000,
        prediction_count: predictionsWithResults.filter(p => p[`actual_${stat}`] !== null).length
      };
    }

    const overallMAE = statTypes.reduce((sum, stat) => sum + scoring[stat].mae, 0) / statTypes.length;
    const overallCalibration = statTypes.reduce((sum, stat) => sum + scoring[stat].calibration_within_10pct, 0) / statTypes.length;

    res.json({
      game_date: gameId,
      total_predictions: predictions.length,
      predictions_with_results: predictionsWithResults.length,
      threshold_used: threshold,
      by_stat: scoring,
      overall: {
        avg_mae: Math.round(overallMAE * 1000) / 1000,
        avg_calibration: Math.round(overallCalibration * 1000) / 1000,
        accuracy_score: Math.round((1 - Math.min(overallMAE / 20, 1)) * 1000) / 1000
      }
    });
  } catch (err: any) {
    logger.error("Score calculation error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accuracy", (_req, res) => {
  const rows = db.prepare(`
    SELECT game_date,
      COUNT(*) as total_predictions,
      AVG(confidence) as avg_confidence
    FROM predictions
    GROUP BY game_date
    ORDER BY game_date DESC
    LIMIT 30
  `).all();
  res.json(rows);
});

app.get("/api/players/search", (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json([]);
  const rows = db.prepare(`
    SELECT * FROM players
    WHERE first_name LIKE ? OR last_name LIKE ?
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`);
  res.json(rows);
});

app.get("/api/players/:id/betting-lines", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const gameDate = (req.query.date as string) || new Date().toISOString().split("T")[0];

    // Get player info
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(playerId) as any;
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Get season averages from API
    const seasonAvg = await getSeasonAverages(playerId);
    if (!seasonAvg) {
      return res.status(404).json({ error: "No season stats available for this player" });
    }

    // Create probability profile
    const profile = createPlayerProfile(
      playerId,
      `${player.first_name} ${player.last_name}`,
      player.team_abbreviation || "",
      player.position || "",
      {
        pts: seasonAvg.pts,
        reb: seasonAvg.reb,
        ast: seasonAvg.ast,
        stl: seasonAvg.stl,
        blk: seasonAvg.blk,
        threes: seasonAvg.fg3m,
        gamesPlayed: seasonAvg.games_played,
      }
    );

    // Calculate betting line probabilities
    const lineProbabilities = calculateAllLineProbabilities(profile);
    const bestBets = findBestBets(lineProbabilities, 0.15);

    res.json({
      playerId,
      playerName: `${player.first_name} ${player.last_name}`,
      team: player.team_abbreviation,
      position: player.position,
      gameDate,
      distributions: profile.distributions,
      confidence: profile.confidence,
      bettingLines: lineProbabilities,
      bestBets,
    });
  } catch (err: any) {
    logger.error("Betting lines error", { error: err.message, playerId: req.params.id });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/best-bets", async (req, res) => {
  try {
    const gameDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
    const minEdge = parseFloat(req.query.minEdge as string) || 0.15;

    // Get today's games
    const gamesRes = await getGames(gameDate);
    const games = gamesRes.data;

    if (games.length === 0) {
      return res.json({ gameDate, bestBets: [], message: "No games scheduled" });
    }

    // Get unique team IDs
    const teamIds = new Set<number>();
    games.forEach((g) => {
      teamIds.add(g.home_team.id);
      teamIds.add(g.visitor_team.id);
    });

    // Fetch team rosters
    const players = await getTeamRoster([...teamIds]);
    const playersWithPosition = players.filter((p) => p.position);

    // Get season averages (limit to avoid rate limits)
    const seasonAverages = new Map<number, BDLSeasonAverage>();
    const fetchLimit = Math.min(playersWithPosition.length, 50);

    for (let i = 0; i < fetchLimit; i++) {
      try {
        const avg = await getSeasonAverages(playersWithPosition[i].id);
        if (avg) seasonAverages.set(playersWithPosition[i].id, avg);
        if (i % 5 === 4) await new Promise((r) => setTimeout(r, 200));
      } catch (e: any) {
        logger.warn(`Skipping player ${playersWithPosition[i].id} due to error: ${e.message}`);
      }
    }

    // Generate predictions with distributions
    const result = generatePredictions(playersWithPosition, seasonAverages, gameDate, true);

    // Collect all best bets
    const allBestBets: any[] = [];
    for (const pred of result.topPlayers) {
      if (pred.bestBets && pred.bestBets.length > 0) {
        for (const bet of pred.bestBets) {
          allBestBets.push({
            playerId: pred.playerId,
            playerName: pred.playerName,
            team: pred.teamAbbrev,
            position: pred.position,
            ...bet,
          });
        }
      }
    }

    // Sort by edge
    allBestBets.sort((a, b) => b.edge - a.edge);

    res.json({
      gameDate,
      totalGames: games.length,
      totalPlayersAnalyzed: seasonAverages.size,
      bestBets: allBestBets.slice(0, 30),
    });
  } catch (err: any) {
    logger.error("Best bets error", { error: err.message });
    res.status(500).json({ error: "Failed to generate best bets" });
  }
});

app.post("/api/ingest/today", async (_req, res) => {
  try {
    const result = await ingestToday();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ingest/players", async (req, res) => {
  try {
    const pageLimit = parseInt(req.body.pageLimit as string) || 50;
    const count = await ingestPlayers(pageLimit);
    res.json({ success: true, playersIngested: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ingest/stats", async (req, res) => {
  try {
    const dates: string[] = req.body.dates || [new Date().toISOString().slice(0, 10)];
    const count = await ingestHistoricalStats(dates);
    res.json({ success: true, statsIngested: count, dates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Paper Trading endpoints
app.post("/api/paper-trading/init", (req, res) => {
  try {
    const startBalance = parseFloat(req.body.startBalance as string) || 10000;
    const bankroll = initBankroll(startBalance);
    res.json({ success: true, bankroll });
  } catch (err: any) {
    logger.error("Paper trading init error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/paper-trading/bankroll", (_req, res) => {
  try {
    let bankroll = getBankroll();
    if (!bankroll) {
      bankroll = initBankroll();
    }
    res.json(bankroll);
  } catch (err: any) {
    logger.error("Get bankroll error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/paper-trading/stats", (_req, res) => {
  try {
    const stats = getBetStats();
    res.json(stats);
  } catch (err: any) {
    logger.error("Get bet stats error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/paper-trading/bets/open", (_req, res) => {
  try {
    const bets = getOpenBets();
    res.json(bets);
  } catch (err: any) {
    logger.error("Get open bets error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/paper-trading/bets/history", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const bets = getBetHistory(limit);
    res.json(bets);
  } catch (err: any) {
    logger.error("Get bet history error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paper-trading/bets", (req, res) => {
  try {
    const {
      playerId,
      playerName,
      teamAbbrev,
      gameDate,
      statType,
      line,
      overOrUnder,
      odds,
      stake,
      edge,
      probability
    } = req.body;

    if (!playerId || !playerName || !gameDate || !statType || line === undefined || !overOrUnder || odds === undefined || stake === undefined || probability === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bet = placeBet(
      playerId, playerName, teamAbbrev || "", gameDate,
      statType, line, overOrUnder, odds, stake, edge || 0, probability
    );
    res.status(201).json({ success: true, bet });
  } catch (err: any) {
    logger.error("Place bet error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paper-trading/kelly", (req, res) => {
  try {
    const { probability, odds, divisor } = req.body;

    if (probability === undefined || odds === undefined) {
      return res.status(400).json({ error: "Missing probability or odds" });
    }

    const kelly = calculateKelly(probability, odds, divisor);
    const americanOdds = probabilityToAmerican(probability);
    
    res.json({
      ...kelly,
      americanOdds: Math.round(americanOdds * 100) / 100
    });
  } catch (err: any) {
    logger.error("Kelly calculation error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paper-trading/settle", (req, res) => {
  try {
    const { betId, actualValue } = req.body;

    if (!betId || actualValue === undefined) {
      return res.status(400).json({ error: "Missing betId or actualValue" });
    }

    const bet = settleBet(betId, actualValue);
    if (!bet) {
      return res.status(404).json({ error: "Bet not found or already settled" });
    }
    res.json({ success: true, bet });
  } catch (err: any) {
    logger.error("Settle bet error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paper-trading/reset", (_req, res) => {
  try {
    resetPaperTrading();
    const bankroll = getBankroll();
    res.json({ success: true, bankroll });
  } catch (err: any) {
    logger.error("Reset paper trading error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/paper-trading/simulate", async (req, res) => {
  try {
    const gameDate = (req.body.date as string) || new Date().toISOString().split("T")[0];
    const minConfidence = parseFloat(req.body.minConfidence as string) || 0.7;
    const minEdge = parseFloat(req.body.minEdge as string) || 0.15;
    const maxBets = parseInt(req.body.maxBets as string) || 10;

    const gamesRes = await getGames(gameDate);
    const games = gamesRes.data;

    if (games.length === 0) {
      return res.json({ gameDate, betsPlaced: 0, message: "No games scheduled" });
    }

    const teamIds = new Set<number>();
    games.forEach((g) => {
      teamIds.add(g.home_team.id);
      teamIds.add(g.visitor_team.id);
    });

    const players = await getTeamRoster([...teamIds]);
    const playersWithPosition = players.filter((p) => p.position);

    const seasonAverages = new Map<number, BDLSeasonAverage>();
    const fetchLimit = Math.min(playersWithPosition.length, 50);

    for (let i = 0; i < fetchLimit; i++) {
      try {
        const avg = await getSeasonAverages(playersWithPosition[i].id);
        if (avg) seasonAverages.set(playersWithPosition[i].id, avg);
        if (i % 5 === 4) await new Promise((r) => setTimeout(r, 200));
      } catch (e: any) {
        logger.warn(`Skipping player ${playersWithPosition[i].id} due to error: ${e.message}`);
      }
    }

    const result = generatePredictions(playersWithPosition, seasonAverages, gameDate, true);

    const bankroll = getBankroll();
    if (!bankroll) {
      initBankroll();
    }

    let betsPlaced = 0;
    const placedBets: any[] = [];

    for (const pred of result.topPlayers) {
      if (betsPlaced >= maxBets) break;
      if (pred.confidence < minConfidence) continue;

      if (pred.bestBets && pred.bestBets.length > 0) {
        for (const bet of pred.bestBets) {
          if (betsPlaced >= maxBets) break;
          if (bet.edge < minEdge) continue;

          const probability = bet.recommendation === 'over' ? bet.overProb : bet.underProb;
          const kelly = calculateKelly(probability, TYPICAL_PROP_ODDS);
          if (kelly.stake < 1) continue;

          const placed = placeBet(
            pred.playerId,
            pred.playerName,
            pred.teamAbbrev,
            gameDate,
            bet.statType,
            bet.lineValue,
            bet.recommendation,
            TYPICAL_PROP_ODDS,
            kelly.stake,
            bet.edge,
            probability
          );

          placedBets.push(placed);
          betsPlaced++;
        }
      }
    }

    res.json({
      gameDate,
      betsPlaced,
      totalStake: placedBets.reduce((sum, b) => sum + b.stake, 0),
      bets: placedBets
    });
  } catch (err: any) {
    logger.error("Paper trading simulate error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Global error handler
interface ApiError extends Error {
  statusCode?: number;
  expose?: boolean;
}

app.use((err: ApiError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 && !err.expose ? 'Internal server error' : err.message;
  
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack, 
    path: (_req as any).path,
    method: (_req as any).method 
  });
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) {
      res.status(404).json({ error: "Frontend not found", message: "Please run: npm run build:frontend" });
    }
  });
});

app.listen(PORT, () => {
  logger.info(`🏀 Sports Stats Estimator running on http://localhost:${PORT}`);
});

export default app;
