import { useState, useEffect, useCallback } from 'react';
import './ROIDashboard.css';

interface ROIStats {
  overall: {
    total_bets: number;
    won_bets: number;
    lost_bets: number;
    pending_bets: number;
    win_rate: number;
    total_profit_loss: number;
    roi: number;
  };
  byStatType: Array<{
    key: string;
    total_bets: number;
    won_bets: number;
    lost_bets: number;
    win_rate: number;
    total_profit_loss: number;
    total_wagered: number;
    roi: number;
  }>;
  byTeam: Array<{
    key: string;
    total_bets: number;
    won_bets: number;
    lost_bets: number;
    win_rate: number;
    total_profit_loss: number;
    total_wagered: number;
    roi: number;
  }>;
  byBetType: Array<{
    key: string;
    total_bets: number;
    won_bets: number;
    lost_bets: number;
    win_rate: number;
    total_profit_loss: number;
    total_wagered: number;
    roi: number;
  }>;
}

interface PlatformAccuracy {
  period_days: number;
  start_date: string;
  end_date: string;
  by_stat_type: Array<{
    stat_type: string;
    total_predictions: number;
    scored_predictions: number;
    pts_mae: number | null;
    reb_mae: number | null;
    ast_mae: number | null;
  }>;
}

export default function ROIDashboard() {
  const [roiData, setRoiData] = useState<ROIStats | null>(null);
  const [platformAccuracy, setPlatformAccuracy] = useState<PlatformAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'stat_type' | 'team' | 'bet_type'>('stat_type');

  const fetchROIData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roiRes, accuracyRes] = await Promise.all([
        fetch('/api/paper-trading/roi-summary'),
        fetch('/api/paper-trading/platform-accuracy?days=30'),
      ]);
      
      if (!roiRes.ok) throw new Error('Failed to fetch ROI data');
      if (!accuracyRes.ok) throw new Error('Failed to fetch platform accuracy');
      
      const roiJson = await roiRes.json();
      const accuracyJson = await accuracyRes.json();
      
      setRoiData(roiJson);
      setPlatformAccuracy(accuracyJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ROI data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchROIData();
  }, [fetchROIData]);

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getROIClass = (roi: number) => {
    if (roi > 5) return 'roi-excellent';
    if (roi > 0) return 'roi-positive';
    if (roi < -5) return 'roi-poor';
    if (roi < 0) return 'roi-negative';
    return 'roi-neutral';
  };

  if (loading) {
    return <div className="roi-dashboard loading">Loading ROI Dashboard...</div>;
  }

  if (error) {
    return <div className="roi-dashboard error">{error}</div>;
  }

  if (!roiData || roiData.overall.total_bets === 0) {
    return (
      <div className="roi-dashboard empty">
        <div className="empty-state">
          <h3>No Paper Trading History</h3>
          <p>Start placing paper trades to track your ROI performance.</p>
        </div>
      </div>
    );
  }

  const breakdownData = filter === 'stat_type' ? roiData.byStatType 
    : filter === 'team' ? roiData.byTeam 
    : roiData.byBetType;

  return (
    <div className="roi-dashboard">
      <section className="overall-stats">
        <h2>Overall Performance</h2>
        <div className="stats-grid">
          <div className="stat-card large">
            <span className="stat-label">Total ROI</span>
            <span className={`stat-value ${getROIClass(roiData.overall.roi)}`}>
              {formatPercent(roiData.overall.roi)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total P&L</span>
            <span className={`stat-value ${roiData.overall.total_profit_loss >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(roiData.overall.total_profit_loss)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{roiData.overall.win_rate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Bets</span>
            <span className="stat-value">{roiData.overall.total_bets}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Won</span>
            <span className="stat-value positive">{roiData.overall.won_bets}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Lost</span>
            <span className="stat-value negative">{roiData.overall.lost_bets}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{roiData.overall.pending_bets}</span>
          </div>
        </div>
      </section>

      <section className="breakdown-section">
        <div className="breakdown-header">
          <h2>Performance Breakdown</h2>
          <div className="filter-tabs">
            <button 
              className={filter === 'stat_type' ? 'active' : ''} 
              onClick={() => setFilter('stat_type')}
            >
              By Stat
            </button>
            <button 
              className={filter === 'team' ? 'active' : ''} 
              onClick={() => setFilter('team')}
            >
              By Team
            </button>
            <button 
              className={filter === 'bet_type' ? 'active' : ''} 
              onClick={() => setFilter('bet_type')}
            >
              Over/Under
            </button>
          </div>
        </div>
        
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>{filter === 'stat_type' ? 'Stat Type' : filter === 'team' ? 'Team' : 'Bet Type'}</th>
              <th>Bets</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Win Rate</th>
              <th>P&L</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {breakdownData.map((row) => (
              <tr key={row.key}>
                <td className="group-key">{row.key?.toUpperCase() || 'N/A'}</td>
                <td>{row.total_bets}</td>
                <td className="positive">{row.won_bets}</td>
                <td className="negative">{row.lost_bets}</td>
                <td>{row.win_rate}%</td>
                <td className={row.total_profit_loss >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(row.total_profit_loss)}
                </td>
                <td className={getROIClass(row.roi)}>
                  {formatPercent(row.roi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {platformAccuracy && platformAccuracy.by_stat_type.length > 0 && (
        <section className="platform-comparison">
          <h2>Platform Prediction Accuracy (Last 30 Days)</h2>
          <p className="comparison-note">
            Compare your paper trading ROI to the platform's prediction accuracy.
            A win rate above the platform's calibration suggests you are selecting value bets.
          </p>
          <div className="accuracy-grid">
            {platformAccuracy.by_stat_type.map((stat) => (
              <div key={stat.stat_type} className="accuracy-card">
                <h4>{stat.stat_type.toUpperCase()}</h4>
                <div className="accuracy-stats">
                  <div className="accuracy-stat">
                    <span className="label">Predictions</span>
                    <span className="value">{stat.total_predictions}</span>
                  </div>
                  <div className="accuracy-stat">
                    <span className="label">Scored</span>
                    <span className="value">{stat.scored_predictions}</span>
                  </div>
                  {stat.pts_mae !== null && (
                    <div className="accuracy-stat">
                      <span className="label">Pts MAE</span>
                      <span className="value">{stat.pts_mae.toFixed(1)}</span>
                    </div>
                  )}
                  {stat.reb_mae !== null && (
                    <div className="accuracy-stat">
                      <span className="label">Reb MAE</span>
                      <span className="value">{stat.reb_mae.toFixed(1)}</span>
                    </div>
                  )}
                  {stat.ast_mae !== null && (
                    <div className="accuracy-stat">
                      <span className="label">Ast MAE</span>
                      <span className="value">{stat.ast_mae.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}