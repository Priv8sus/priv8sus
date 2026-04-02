import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HistoricalView from './components/HistoricalView';
import AccuracyMetrics from './components/AccuracyMetrics';
import { PlayerDetailPanel } from './components/PlayerDetailPanel';
import { TopPredictions } from './components/TopPredictions';
import { LandingPage } from './components/LandingPage';
import { UserProfile } from './components/UserProfile';
import { TourGuide } from './components/TourGuide';
import { useTourComplete } from './hooks/useTourComplete';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useWelcomeComplete } from './hooks/useWelcomeComplete';
import { capturePageView } from './analytics';
import type { PredictionsResponse, PlayerPrediction } from './types/predictions';
import './App.css';

interface DashboardProps {
  showProfile: () => void;
}

function Dashboard({ showProfile }: DashboardProps) {
  const { user, logout, completeTour } = useAuth();
  const [data, setData] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPrediction | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const { completed: tourCompleted, markComplete: markTourComplete } = useTourComplete();
  const [showTour, setShowTour] = useState(false);

  const isTourCompleted = tourCompleted || user?.tourCompleted;

  const handleTourComplete = async () => {
    await completeTour();
    markTourComplete();
  };

  useEffect(() => {
    capturePageView(activeTab === 'today' ? 'dashboard_today' : 'dashboard_history');
  }, [activeTab]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/predictions?date=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setActiveTab('today');
  };

  useEffect(() => {
    if (!isTourCompleted && user) {
      setShowTour(true);
    }
  }, [user, isTourCompleted]);

  if (loading) {
    return <div className="dashboard loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="header-left">
          <div className="logo">🏀 Priv8sus</div>
          {!isTourCompleted && (
            <button className="tour-help-btn" onClick={() => setShowTour(true)}>
              ? Help
            </button>
          )}
        </div>
        <div className="header-center">
          <div className="date-selector">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
            />
            <span className="date-display">{formatDate(selectedDate)}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="tab-nav">
            <button 
              className={activeTab === 'today' ? 'active' : ''} 
              onClick={() => setActiveTab('today')}
            >
              Today's Games
            </button>
            <button 
              className={activeTab === 'history' ? 'active' : ''} 
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
          <span className="user-email">{user?.email}</span>
          <button className="profile-btn" onClick={showProfile}>Account</button>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      {activeTab === 'today' ? (
        <main className="dash-main">
          {data?.games && data.games.length > 0 && (
            <section className="games-strip">
              <h2>TODAY'S GAMES</h2>
              <div className="games-list">
                {data.games.map(game => (
                  <div 
                    key={game.id} 
                    className={`game-card ${selectedGame === game.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  >
                    <div className="game-matchup">
                      <span className="team">{game.visitorAbbr}</span>
                      <span className="at">@</span>
                      <span className="team">{game.homeAbbr}</span>
                    </div>
                    <div className="game-time">
                      {game.status === 'scheduled' ? 'Scheduled' : game.status}
                    </div>
                    <div className="game-status">
                      {game.homeScore !== null && game.visitorScore !== null
                        ? `${game.visitorScore} - ${game.homeScore}`
                        : 'Predictions Ready'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(!data?.games || data.games.length === 0) && (
            <div className="no-games">No games scheduled for this date</div>
          )}

          <div className="main-grid">

            <section className="predictions-section">
              <h2>
                Top Predictions
                {selectedGame && data?.games && (
                  <span className="filter-badge">
                    {data.games.find(g => g.id === selectedGame)?.visitorAbbr}@ 
                    {data.games.find(g => g.id === selectedGame)?.homeAbbr}
                    <button onClick={() => setSelectedGame(null)} className="clear-filter">×</button>
                  </span>
                )}
              </h2>
              <div className="predictions-list">
                {data?.topPlayers && data.topPlayers.length > 0 ? (
                  <TopPredictions 
                    players={(selectedGame && data.games
                      ? data.topPlayers.filter(p => {
                          const game = data.games.find(g => g.id === selectedGame);
                          return game && (p.teamAbbrev === game.homeAbbr || p.teamAbbrev === game.visitorAbbr);
                        })
                      : data.topPlayers
                    ).slice(0, 20)} 
                    onPlayerClick={setSelectedPlayer} 
                  />
                ) : (
                  <div className="empty-state">No predictions available</div>
                )}
              </div>
            </section>

            <aside className="accuracy-sidebar">
              <AccuracyMetrics />
            </aside>
          </div>
        </main>
      ) : (
        <main className="dash-main">
          <HistoricalView />
        </main>
      )}

      <PlayerDetailPanel
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      {showTour && (
        <TourGuide onComplete={() => {
          setShowTour(false);
          handleTourComplete();
        }} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, isLoading, completeOnboarding } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { completed: welcomeCompleted, markComplete: markWelcomeComplete } = useWelcomeComplete();

  useEffect(() => {
    if (user) {
      setShowDashboard(true);
      capturePageView('dashboard');
    } else {
      capturePageView('landing');
    }
  }, [user]);

  const handleWelcomeComplete = async () => {
    await completeOnboarding();
    markWelcomeComplete();
  };

  if (isLoading) {
    return <div className="dashboard loading">Loading...</div>;
  }

  if (showDashboard) {
    return (
      <div>
        <button
          className="back-to-landing"
          onClick={() => setShowDashboard(false)}
        >
          ← Back to Home
        </button>
        {!welcomeCompleted && !user?.onboardingCompleted && (
          <WelcomeScreen
            onContinue={handleWelcomeComplete}
            onSkip={handleWelcomeComplete}
          />
        )}
        <Dashboard showProfile={() => setShowProfile(true)} />
        {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      </div>
    );
  }

  return <LandingPage />;
}

export default App;
