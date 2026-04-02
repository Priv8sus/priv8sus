import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Login } from './Login';
import { Signup } from './Signup';
import './LandingPage.css';

type AuthMode = 'login' | 'signup' | null;

export function LandingPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage("You're on the list! We'll send daily NBA predictions to your inbox.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="logo">🏀 Priv8sus</div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          {user ? (
            <a href="/dashboard" className="nav-cta">Dashboard</a>
          ) : (
            <>
              <button className="nav-link" onClick={() => setAuthMode('login')}>Sign In</button>
              <button className="nav-cta" onClick={() => setAuthMode('signup')}>Get Started</button>
            </>
          )}
        </nav>
      </header>

      {authMode && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <button className="auth-modal-close" onClick={() => setAuthMode(null)}>×</button>
            {authMode === 'login' ? (
              <Login onSwitchToSignup={() => setAuthMode('signup')} onClose={() => setAuthMode(null)} />
            ) : (
              <Signup onSwitchToLogin={() => setAuthMode('login')} onClose={() => setAuthMode(null)} />
            )}
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">AI-Powered Sports Predictions</span>
          <h1>Win More Bets with NBA Player Props</h1>
          <p className="hero-subtitle">
            Get AI-generated player prop predictions with confidence scores, 
            statistical analysis, and Kelly criterion betting recommendations.
            Paper trade risk-free before going live.
          </p>
          <form className="hero-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <button type="submit" disabled={status === 'loading' || status === 'success'}>
              {status === 'loading' ? 'Joining...' : status === 'success' ? 'Joined!' : 'Join Waitlist'}
            </button>
          </form>
          {message && (
            <p className={`form-message ${status}`}>{message}</p>
          )}
          <p className="hero-social-proof">
            Join <strong>1,247</strong> bettors getting daily predictions
          </p>
        </div>
      </section>

      <section className="stats-banner">
        <div className="stat">
          <span className="stat-value">73%</span>
          <span className="stat-label">Avg. Prediction Accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">15+</span>
          <span className="stat-label">Props Analyzed Daily</span>
        </div>
        <div className="stat">
          <span className="stat-value">$10K</span>
          <span className="stat-label">Paper Trading Bankroll</span>
        </div>
      </section>

      <section className="features" id="features">
        <h2>Everything You Need to Beat the Books</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>AI-Powered Predictions</h3>
            <p>
              Machine learning models analyze player stats, matchups, and trends 
              to generate accurate player prop predictions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Confidence Scores</h3>
            <p>
              Every prediction comes with a confidence score so you know which 
              bets to prioritize and which to skip.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Kelly Criterion Sizing</h3>
            <p>
              Get optimal bet sizing recommendations using the Kelly formula. 
              Never overbet or underbet again.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Paper Trading</h3>
            <p>
              Practice with $10,000 in virtual money. Track your performance 
              and refine your strategy risk-free.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏀</div>
            <h3>NBA-Focused</h3>
            <p>
              Deep-dive NBA analysis covering points, rebounds, assists, 
              steals, blocks, and three-pointers.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📬</div>
            <h3>Daily Email Picks</h3>
            <p>
              Wake up to today's best NBA prop bets delivered straight to 
              your inbox every morning.
            </p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Sign Up</h3>
            <p>Enter your email to join the waitlist and get early access.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Get Daily Picks</h3>
            <p>Receive AI-generated player prop predictions every morning.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Paper Trade</h3>
            <p>Test your picks with virtual money before betting real funds.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Win More</h3>
            <p>Use data-driven insights to make smarter betting decisions.</p>
          </div>
        </div>
      </section>

      <section className="cta-section" id="subscribe">
        <h2>Ready to Beat the Books?</h2>
        <p>Join thousands of smart bettors using AI to gain an edge.</p>
        <form className="cta-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading' || status === 'success'}
          />
          <button type="submit" disabled={status === 'loading' || status === 'success'}>
            {status === 'loading' ? 'Joining...' : status === 'success' ? "You're In!" : 'Join Waitlist'}
          </button>
        </form>
        {message && status === 'error' && (
          <p className="form-message error">{message}</p>
        )}
        <p className="cta-note">Free to join. No spam. Unsubscribe anytime.</p>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Priv8sus. AI-powered NBA predictions.</p>
      </footer>
    </div>
  );
}