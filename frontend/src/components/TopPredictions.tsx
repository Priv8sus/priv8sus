import { useState } from 'react';
import type { PlayerPrediction } from '../types/predictions';
import { capturePaperTrade, captureFirstPrediction, captureFirstPredictionViewed } from '../analytics';
import { useAuth } from '../context/AuthContext';
import { getTrendIcon, getTrendClass } from '../utils/format';
import './TopPredictions.css';

interface TopPredictionsProps {
  players: PlayerPrediction[];
  onPlayerClick: (player: PlayerPrediction) => void;
}

async function placePaperTrade(player: PlayerPrediction, statType: string, line: number, overOrUnder: 'over' | 'under', odds: number) {
  const gameDate = new Date().toISOString().split('T')[0];
  const response = await fetch('/api/paper-trading/bets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: player.playerId,
      playerName: player.playerName,
      teamAbbrev: player.teamAbbrev,
      gameDate,
      statType,
      line,
      overOrUnder,
      odds,
      stake: 10,
      edge: player.confidence - 0.5,
      probability: player.confidence
    })
  });
  if (!response.ok) {
    throw new Error('Failed to place bet');
  }
  return response.json();
}

export function TopPredictions({ players, onPlayerClick }: TopPredictionsProps) {
  const { user } = useAuth();
  const [tradingStates, setTradingStates] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [hasTrackedFirstView, setHasTrackedFirstView] = useState(false);

  if (players.length === 0) {
    return (
      <div className="top-predictions empty">
        <p>No predictions available</p>
      </div>
    );
  }

  function handlePlayerClick(player: PlayerPrediction) {
    if (!hasTrackedFirstView && user) {
      captureFirstPredictionViewed(user.id, player.playerId, player.playerName, player.confidence);
      setHasTrackedFirstView(true);
    }
    onPlayerClick(player);
  }

  function handlePaperTrade(e: React.MouseEvent, player: PlayerPrediction) {
    e.stopPropagation();
    const state = tradingStates[player.playerId] || 'idle';
    if (state !== 'idle') return;

    setTradingStates(prev => ({ ...prev, [player.playerId]: 'loading' }));

    const bestBet = player.bestBets?.[0];
    if (!bestBet) {
      setTradingStates(prev => ({ ...prev, [player.playerId]: 'error' }));
      setTimeout(() => setTradingStates(prev => ({ ...prev, [player.playerId]: 'idle' })), 2000);
      return;
    }

    const odds = bestBet.overPayout !== undefined ? 110 : -110;
    placePaperTrade(player, bestBet.stat, bestBet.line, bestBet.overPayout !== undefined ? 'over' : 'under', odds)
      .then((result) => {
        setTradingStates(prev => ({ ...prev, [player.playerId]: 'success' }));
        if (user) {
          const storageKey = `hasPlacedPrediction_${user.id}`;
          const isFirst = !localStorage.getItem(storageKey);
          if (isFirst) {
            localStorage.setItem(storageKey, 'true');
            captureFirstPrediction(user.id, player.playerId, player.playerName, player.confidence);
          }
          capturePaperTrade(user.id, player.playerId, player.playerName, 10, odds, result.potentialPayout || 0);
        }
        setTimeout(() => setTradingStates(prev => ({ ...prev, [player.playerId]: 'idle' })), 2000);
      })
      .catch(() => {
        setTradingStates(prev => ({ ...prev, [player.playerId]: 'error' }));
        setTimeout(() => setTradingStates(prev => ({ ...prev, [player.playerId]: 'idle' })), 2000);
      });
  }

  return (
    <div className="top-predictions">
      <h2>TOP PREDICTIONS</h2>
      <div className="predictions-list">
        {players.map((player, index) => {
          const avg = player.seasonAverages;
          const confidencePercent = Math.round(player.confidence * 100);
          const isBestBet = index === 0 && confidencePercent >= 70;
          const tradeState = tradingStates[player.playerId] || 'idle';

          return (
            <div
              key={player.playerId}
              className={`prediction-card ${isBestBet ? 'best-bet' : ''}`}
              onClick={() => handlePlayerClick(player)}
            >
              {isBestBet && (
                <div className="best-bet-badge">TOP PICK FOR YOU</div>
              )}
              <div className="player-header">
                <div className="player-info">
                  <span className="player-name">{player.playerName}</span>
                  <span className="player-meta">{player.teamAbbrev} | {player.position}</span>
                </div>
                <div className="confidence-badge" data-confidence={confidencePercent >= 70 ? 'high' : confidencePercent >= 50 ? 'medium' : 'low'}>
                  {confidencePercent}%
                </div>
              </div>

              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>

              <div className="stats-grid">
                <div className="stat-row">
                  <span className="stat-label">Pts:</span>
                  <span className="stat-value">{player.predictedPts.toFixed(1)}</span>
                  {avg && (
                    <>
                      <span className="stat-avg">(avg: {avg.pts.toFixed(1)})</span>
                      <span className={`stat-trend ${getTrendClass(player.predictedPts, avg.pts)}`}>
                        {getTrendIcon(player.predictedPts, avg.pts)}
                      </span>
                    </>
                  )}
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reb:</span>
                  <span className="stat-value">{player.predictedReb.toFixed(1)}</span>
                  {avg && (
                    <>
                      <span className="stat-avg">(avg: {avg.reb.toFixed(1)})</span>
                      <span className={`stat-trend ${getTrendClass(player.predictedReb, avg.reb)}`}>
                        {getTrendIcon(player.predictedReb, avg.reb)}
                      </span>
                    </>
                  )}
                </div>
                <div className="stat-row">
                  <span className="stat-label">Ast:</span>
                  <span className="stat-value">{player.predictedAst.toFixed(1)}</span>
                  {avg && (
                    <>
                      <span className="stat-avg">(avg: {avg.ast.toFixed(1)})</span>
                      <span className={`stat-trend ${getTrendClass(player.predictedAst, avg.ast)}`}>
                        {getTrendIcon(player.predictedAst, avg.ast)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isBestBet && (
                <button
                  className={`paper-trade-btn ${tradeState}`}
                  onClick={(e) => handlePaperTrade(e, player)}
                  disabled={tradeState !== 'idle'}
                >
                  {tradeState === 'loading' ? 'Placing...' : tradeState === 'success' ? 'Bet Placed!' : tradeState === 'error' ? 'Failed' : 'Paper Trade'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}