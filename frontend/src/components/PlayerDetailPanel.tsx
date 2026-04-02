import type { PlayerPrediction } from '../types/predictions';
import { getTrendIcon, getDiffPercent } from '../utils/format';
import './PlayerDetailPanel.css';

interface PlayerDetailPanelProps {
  player: PlayerPrediction | null;
  onClose: () => void;
}

export function PlayerDetailPanel({ player, onClose }: PlayerDetailPanelProps) {
  if (!player) return null;

  const avg = player.seasonAverages;
  const confidencePercent = Math.round(player.confidence * 100);

  return (
    <div className="player-detail-panel">
      <div className="panel-backdrop" onClick={onClose} />
      <div className="panel-content">
        <div className="panel-header">
          <div className="player-title">
            <h2>{player.playerName}</h2>
            <span className="player-team">{player.teamAbbrev}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="player-meta">
          <span>Position: {player.position}</span>
        </div>

        <div className="stats-comparison">
          <div className="comparison-header">
            <span className="col-stat">STAT</span>
            <span className="col-pred">PRED</span>
            <span className="col-avg">AVG</span>
            <span className="col-diff">DIFF</span>
          </div>

          <div className="comparison-row">
            <span className="col-stat">Points</span>
            <span className="col-pred">{player.predictedPts.toFixed(1)}</span>
            <span className="col-avg">{avg ? avg.pts.toFixed(1) : '—'}</span>
            <span className="col-diff">
              {avg && (
                <>
                  {getTrendIcon(player.predictedPts, avg.pts, 0.03)}
                  {getDiffPercent(player.predictedPts, avg?.pts)}
                </>
              )}
            </span>
          </div>

          <div className="comparison-row">
            <span className="col-stat">Rebounds</span>
            <span className="col-pred">{player.predictedReb.toFixed(1)}</span>
            <span className="col-avg">{avg ? avg.reb.toFixed(1) : '—'}</span>
            <span className="col-diff">
              {avg && (
                <>
                  {getTrendIcon(player.predictedReb, avg.reb, 0.03)}
                  {getDiffPercent(player.predictedReb, avg?.reb)}
                </>
              )}
            </span>
          </div>

          <div className="comparison-row">
            <span className="col-stat">Assists</span>
            <span className="col-pred">{player.predictedAst.toFixed(1)}</span>
            <span className="col-avg">{avg ? avg.ast.toFixed(1) : '—'}</span>
            <span className="col-diff">
              {avg && (
                <>
                  {getTrendIcon(player.predictedAst, avg.ast, 0.03)}
                  {getDiffPercent(player.predictedAst, avg?.ast)}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="confidence-section">
          <div className="confidence-label">
            Confidence: <strong>{confidencePercent}%</strong>
          </div>
          <div className="confidence-bar-large">
            <div 
              className="confidence-fill" 
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {player.bestBets && player.bestBets.length > 0 && (
          <div className="best-bets-section">
            <h3>Best Bets</h3>
            {player.bestBets.slice(0, 3).map((bet, idx) => (
              <div key={idx} className="best-bet">
                <span className="bet-line">
                  {bet.recommendation.toUpperCase()} {bet.line.toFixed(1)} {bet.stat}
                </span>
                <span className="bet-edge">Edge: {(bet.edge * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}