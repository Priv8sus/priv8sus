import { Resend } from 'resend';
import { getDb } from './db.js';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_key_here'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = 'Priv8sus <noreply@priv8sus.com>';
const COMPANY_PREFIX = 'PAP';

interface EmailJob {
  id?: number;
  user_id: number;
  email_type: 'welcome' | 'day1' | 'day3' | 'premium';
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  resend_message_id?: string;
  created_at?: string;
}

interface User {
  id: number;
  email: string;
  created_at: string;
}

export async function sendEmail(to: string, subject: string, html: string, trackingId: string): Promise<string | null> {
  if (!resend) {
    console.warn('Resend not configured, skipping email send to:', to);
    return null;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: html + getTrackingPixel(trackingId),
      text: stripHtml(html),
    });

    if (error) {
      console.error('Resend error:', error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('sendEmail error:', err);
    return null;
  }
}

function getTrackingPixel(trackingId: string): string {
  return `<img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/email/track/${trackingId}" width="1" height="1" style="display:none" />`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export function getTrackingId(userId: number, emailType: string): string {
  return Buffer.from(`${userId}-${emailType}-${Date.now()}`).toString('base64url');
}

export async function queueEmail(userId: number, emailType: 'welcome' | 'day1' | 'day3' | 'premium', sendAt: Date): Promise<void> {
  const db = getDb();
  const scheduledFor = sendAt.toISOString();

  db.prepare(`
    INSERT INTO email_jobs (user_id, email_type, scheduled_for, status)
    VALUES (?, ?, ?, 'pending')
  `).run(userId, emailType, scheduledFor);
}

export async function sendWelcomeEmail(user: User): Promise<string | null> {
  const trackingId = getTrackingId(user.id, 'welcome');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Priv8sus is live — your predictions await</h1>
      <p style="color: #333;">Hi there,</p>
      <p style="color: #333;">You've been waiting for something different in sports betting predictions.</p>
      <p style="color: #333;"><strong>Priv8sus is now live.</strong></p>
      <p style="color: #333;">We built Priv8sus around one principle: your predictions should stay private. No data harvesting. No algorithmic manipulation. Just honest markets where your insights have real value.</p>
      <p style="color: #333;"><strong>What this means for you:</strong></p>
      <ul style="color: #333;">
        <li>Your prediction models stay yours</li>
        <li>Your betting data isn't sold to brokers</li>
        <li>You keep the edge you've worked to build</li>
      </ul>
      <p style="color: #333;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background: #4a90d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Get Started</a></p>
      <p style="color: #666; font-size: 12px;">Predict. Profit. Keep your secrets.</p>
      <p style="color: #666; font-size: 12px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?uid=${user.id}">Unsubscribe</a></p>
    </div>
  `;

  const messageId = await sendEmail(user.email, 'Priv8sus is live — your predictions await', html, trackingId);

  if (messageId) {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_events (user_id, email_type, event_type, message_id)
      VALUES (?, 'welcome', 'sent', ?)
    `).run(user.id, messageId);
  }

  return messageId;
}

export async function sendDay1Email(user: User): Promise<string | null> {
  const trackingId = getTrackingId(user.id, 'day1');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Your first prediction on Priv8sus — here's how to get started</h1>
      <p style="color: #333;">Hi there,</p>
      <p style="color: #333;">Welcome to Priv8sus. Here's how to start predicting:</p>
      <p style="color: #333;"><strong>Step 1:</strong> Set up your profile — choose your sports, build your prediction models.</p>
      <p style="color: #333;"><strong>Step 2:</strong> Explore NBA markets — moneyline, spreads, and parlays.</p>
      <p style="color: #333;"><strong>Step 3:</strong> Track your edge — monitor your prediction performance.</p>
      <p style="color: #333;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background: #4a90d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Predictions</a></p>
      <p style="color: #666; font-size: 12px;">Predict. Profit. Keep your secrets.</p>
      <p style="color: #666; font-size: 12px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?uid=${user.id}">Unsubscribe</a></p>
    </div>
  `;

  const messageId = await sendEmail(user.email, 'Your first prediction on Priv8sus — here\'s how to get started', html, trackingId);

  if (messageId) {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_events (user_id, email_type, event_type, message_id)
      VALUES (?, 'day1', 'sent', ?)
    `).run(user.id, messageId);
  }

  return messageId;
}

export async function sendDay3Email(user: User): Promise<string | null> {
  const trackingId = getTrackingId(user.id, 'day3');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Your predictions are waiting — don't let the edge slip away</h1>
      <p style="color: #333;">Hi there,</p>
      <p style="color: #333;">The NBA season is heating up, and your predictions should be working for you — not against you.</p>
      <p style="color: #333;"><strong>Did you know?</strong> On Priv8sus, your betting patterns stay private. While other platforms sell your insights to brokers, we keep your edge exactly where it belongs: with you.</p>
      <p style="color: #333;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background: #4a90d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Make Your Picks</a></p>
      <p style="color: #666; font-size: 12px;">Predict. Profit. Keep your secrets.</p>
      <p style="color: #666; font-size: 12px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?uid=${user.id}">Unsubscribe</a></p>
    </div>
  `;

  const messageId = await sendEmail(user.email, 'Your predictions are waiting — don\'t let the edge slip away', html, trackingId);

  if (messageId) {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_events (user_id, email_type, event_type, message_id)
      VALUES (?, 'day3', 'sent', ?)
    `).run(user.id, messageId);
  }

  return messageId;
}

export async function sendDailyDigestEmail(user: User, topPredictions: any[], favoriteTeams: string[], yesterdayAccuracy: any): Promise<string | null> {
  const trackingId = getTrackingId(user.id, 'daily_digest');
  
  const personalizedPredictions = favoriteTeams.length > 0
    ? topPredictions.filter((p: any) => favoriteTeams.includes(p.teamAbbrev))
    : topPredictions.slice(0, 5);
  
  const predictionsHtml = personalizedPredictions.length > 0
    ? personalizedPredictions.map((p: any) => `
        <div style="background: #f5f5f5; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <strong>${p.playerName}</strong> (${p.teamAbbrev})<br/>
          <span style="color: #666;">Points: ${p.predictedPts?.toFixed(1) || 'N/A'}</span> | 
          <span style="color: #666;">Rebounds: ${p.predictedReb?.toFixed(1) || 'N/A'}</span> | 
          <span style="color: #666;">Assists: ${p.predictedAst?.toFixed(1) || 'N/A'}</span><br/>
          <span style="color: #4a90d9;">Confidence: ${((p.confidence || 0) * 100).toFixed(0)}%</span>
        </div>
      `).join('')
    : '<p style="color: #666;">No personalized predictions available today. Check out our top picks below!</p>';

  const accuracyHtml = yesterdayAccuracy
    ? `<div style="background: #e8f5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; color: #2e7d32;">Yesterday's Accuracy</h3>
        <p style="margin: 4px 0;">Points MAE: ${yesterdayAccuracy.ptsMAE?.toFixed(2) || 'N/A'}</p>
        <p style="margin: 4px 0;">Rebounds MAE: ${yesterdayAccuracy.rebMAE?.toFixed(2) || 'N/A'}</p>
        <p style="margin: 4px 0;">Assists MAE: ${yesterdayAccuracy.astMAE?.toFixed(2) || 'N/A'}</p>
      </div>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">🏀 Your Daily NBA Predictions</h1>
      <p style="color: #333;">Hi there,</p>
      <p style="color: #333;">Here's your personalized daily digest from Priv8sus:</p>
      
      ${accuracyHtml}
      
      <h2 style="color: #1a1a2e;">Top Predictions ${favoriteTeams.length > 0 ? 'for Your Teams' : 'Today'}</h2>
      ${predictionsHtml}
      
      ${favoriteTeams.length > 0 ? `<p style="color: #666; font-size: 12px;">Showing predictions for: ${favoriteTeams.join(', ')}</p>` : ''}
      
      <p style="color: #333;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background: #4a90d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Full Dashboard</a></p>
      <p style="color: #666; font-size: 12px;">Predict. Profit. Keep your secrets.</p>
      <p style="color: #666; font-size: 12px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?uid=${user.id}">Unsubscribe</a></p>
    </div>
  `;

  const messageId = await sendEmail(user.email, '🏀 Your Daily NBA Predictions are Ready', html, trackingId);

  if (messageId) {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_events (user_id, email_type, event_type, message_id)
      VALUES (?, 'daily_digest', 'sent', ?)
    `).run(user.id, messageId);
  }

  return messageId;
}

export async function sendDailyDigestToAllUsers(topPredictions: any[], yesterdayAccuracy: any): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  
  const users = db.prepare(`
    SELECT id, email FROM users WHERE email_unsubscribed = 0
  `).all() as { id: number; email: string }[];

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const favoriteTeams = db.prepare(`
      SELECT team_abbreviation FROM favorite_teams WHERE user_id = ?
    `).all(user.id) as { team_abbreviation: string }[];
    
    const teamAbbrevs = favoriteTeams.map(t => t.team_abbreviation);
    const userObj: User = { id: user.id, email: user.email, created_at: '' };
    
    const messageId = await sendDailyDigestEmail(userObj, topPredictions, teamAbbrevs, yesterdayAccuracy);
    if (messageId) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export async function processEmailQueue(): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  const pendingJobs = db.prepare(`
    SELECT j.*, u.email, u.id as uid
    FROM email_jobs j
    JOIN users u ON j.user_id = u.id
    WHERE j.status = 'pending' AND j.scheduled_for <= ?
    ORDER BY j.scheduled_for ASC
    LIMIT 50
  `).all(now) as (EmailJob & { email: string })[];

  for (const job of pendingJobs) {
    const user: User = { id: job.user_id, email: job.email, created_at: '' };

    let messageId: string | null = null;
    switch (job.email_type) {
      case 'welcome':
        messageId = await sendWelcomeEmail(user);
        break;
      case 'day1':
        messageId = await sendDay1Email(user);
        break;
      case 'day3':
        messageId = await sendDay3Email(user);
        break;
    }

    if (messageId) {
      db.prepare(`
        UPDATE email_jobs SET status = 'sent', sent_at = datetime('now'), resend_message_id = ? WHERE id = ?
      `).run(messageId, job.id);
    } else {
      db.prepare(`
        UPDATE email_jobs SET status = 'failed' WHERE id = ?
      `).run(job.id);
    }
  }
}

export async function recordEmailOpen(trackingId: string): Promise<void> {
  try {
    const db = getDb();
    const decoded = Buffer.from(trackingId, 'base64url').toString('utf-8');
    const [userId, emailType] = decoded.split('-').slice(0, 2);

    db.prepare(`
      INSERT INTO email_events (user_id, email_type, event_type)
      VALUES (?, ?, 'opened')
    `).run(parseInt(userId), emailType);
  } catch (err) {
    console.error('recordEmailOpen error:', err);
  }
}

export async function unsubscribeUser(userId: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare(`
    UPDATE users SET email_unsubscribed = 1, updated_at = datetime('now') WHERE id = ?
  `).run(userId);

  if (result.changes > 0) {
    db.prepare(`
      DELETE FROM email_jobs WHERE user_id = ? AND status = 'pending'
    `).run(userId);

    return true;
  }
  return false;
}

export function initEmailSchema(db: ReturnType<typeof getDb>): void {
  db.exec(`
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

    ALTER TABLE users ADD COLUMN email_unsubscribed INTEGER DEFAULT 0;
  `);
}
