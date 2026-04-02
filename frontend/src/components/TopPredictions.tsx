import type { PlayerPrediction } from '../types/predictions';
import './TopPredictions.css';

interface TopPredictionsProps {
  players: PlayerPrediction[];
  onPlayerClick: (player: PlayerPrediction) => void;
}

function getTrendIcon(predicted: number, avg: number | undefined): string {
  if (avg === undefined) return '→';
  const diff = predicted - avg;
  const threshold = avg * 0.05;
  if (diff > threshold) return '↑';
  if (diff < -threshold) return '↓';
  return '→';
}

function getTrendClass(predicted: number, avg: number | undefined): string {
  if (avg === undefined) return 'trend-neutral';
  const diff = predicted - avg;
  const threshold = avg * 0.05;
  if (diff > threshold) return 'trend-up';
  if (diff < -threshold) return 'trend-down';
  return 'trend-neutral';
}

export function TopPredictions({ players, onPlayerClick }: TopPredictionsProps) {
  if (players.length === 0) {
    return (
      <div className="top-predictions empty">
        <p>No predictions available</p>
      </div>
    );
  }

  return (
    <div className="top-predictions">
      <h2>TOP PREDICTIONS</h2>
      <div className="predictions-list">
        {players.map((player) => {
          const avg = player.seasonAverages;
          const confidencePercent = Math.round(player.confidence * 100);
          
          return (
            <div 
              key={player.playerId} 
              className="prediction-card"
              onClick={() => onPlayerClick(player)}
            >
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
            </div>
          );
        })}
      </div>
    </div>
  );
}