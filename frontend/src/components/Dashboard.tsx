import { useState, useEffect } from 'react';
import { TopPredictions } from './TopPredictions';
import { PlayerDetailPanel } from './PlayerDetailPanel';
import type { PredictionsResponse, PlayerPrediction, Game } from '../types/predictions';
import './Dashboard.css';

export function Dashboard() {
  const [data, setData] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPrediction | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPredictions(selectedDate);
  }, [selectedDate]);

  async function fetchPredictions(date: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/predictions?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: PredictionsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(days: number) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">🏀 NBA Prediction Dashboard</div>
          <div className="date-selector">
            <button onClick={() => handleDateChange(-1)}>←</button>
            <span>{formatDate(selectedDate)}</span>
            <button onClick={() => handleDateChange(1)} disabled={selectedDate >= new Date().toISOString().split('T')[0]}>→</button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading predictions...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => fetchPredictions(selectedDate)}>Retry</button>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {data.games.length > 0 && (
            <section className="games-strip">
              <h2>TODAY'S GAMES</h2>
              <div className="games-list">
                {data.games.map((game: Game) => (
                  <div key={game.id} className="game-card">
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

          {data.games.length === 0 && data.message && (
            <div className="no-games">
              <p>{data.message}</p>
            </div>
          )}

          <div className="main-content">
            <div className="predictions-section">
              <TopPredictions 
                players={data.topPlayers} 
                onPlayerClick={setSelectedPlayer} 
              />
            </div>

            <aside className="accuracy-panel">
              <h2>MODEL ACCURACY</h2>
              <div className="accuracy-metrics">
                <div className="metric">
                  <span className="metric-label">Points MAE</span>
                  <span className="metric-value">—</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Rebounds MAE</span>
                  <span className="metric-value">—</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Assists MAE</span>
                  <span className="metric-value">—</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Calibration</span>
                  <span className="metric-value">—</span>
                </div>
              </div>
              <div className="accuracy-note">
                Historical accuracy data will appear here once we have actual results to compare.
              </div>
            </aside>
          </div>
        </>
      )}

      <PlayerDetailPanel 
        player={selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
      />
    </div>
  );
}