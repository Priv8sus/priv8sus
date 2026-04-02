import { useState, useEffect, useCallback } from 'react';

interface Prediction {
  id: number;
  player_id: number;
  game_date: string;
  predicted_pts: number;
  predicted_reb: number;
  predicted_ast: number;
  predicted_stl: number;
  predicted_blk: number;
  predicted_threes: number;
  actual_pts: number | null;
  actual_reb: number | null;
  actual_ast: number | null;
  confidence: number;
  first_name: string;
  last_name: string;
  team_abbreviation: string;
  position: string;
}

interface HistoricalEntry {
  game_date: string;
  total_predictions: number;
  avg_confidence: number;
}

interface AccuracyByDate {
  game_date: string;
  total_predictions: number;
  avg_confidence: number;
  pts_mae?: number;
  reb_mae?: number;
  ast_mae?: number;
  calib?: number;
}

export default function HistoricalView() {
  const [history, setHistory] = useState<Prediction[]>([]);
  const [accuracy, setAccuracy] = useState<HistoricalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, accuracyRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/accuracy')
      ]);
      const historyData = await historyRes.json();
      const accuracyData = await accuracyRes.json();
      setHistory(Array.isArray(historyData) ? historyData : []);
      setAccuracy(Array.isArray(accuracyData) ? accuracyData : []);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedByDate = history.reduce((acc, pred) => {
    const date = pred.game_date;
    if (!acc[date]) {
      acc[date] = { predictions: [], games: new Set() };
    }
    acc[date].predictions.push(pred);
    return acc;
  }, {} as Record<string, { predictions: Prediction[], games: Set<string> }>);

  const dateList = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getAccuracyForDate = (date: string): AccuracyByDate | undefined => {
    return accuracy.find(a => a.game_date === date);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setViewMode('detail');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <div className="historical-view loading">Loading historical data...</div>;
  }

  if (viewMode === 'detail' && selectedDate) {
    const datePredictions = groupedByDate[selectedDate]?.predictions || [];
    const accuracyData = getAccuracyForDate(selectedDate);
    
    return (
      <div className="historical-view detail-view">
        <div className="detail-header">
          <button className="back-btn" onClick={() => setViewMode('list')}>
            ← Back to History
          </button>
          <h2>{formatFullDate(selectedDate)}</h2>
        </div>
        
        <div className="detail-stats">
          <div className="stat-card">
            <span className="stat-value">{datePredictions.length}</span>
            <span className="stat-label">Predictions</span>
          </div>
          {accuracyData && (
            <>
              <div className="stat-card">
                <span className="stat-value">{Math.round(accuracyData.avg_confidence * 100)}%</span>
                <span className="stat-label">Avg Confidence</span>
              </div>
            </>
          )}
        </div>

        <div className="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Pts (Pred/Actual)</th>
                <th>Reb (Pred/Actual)</th>
                <th>Ast (Pred/Actual)</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {datePredictions.map(pred => (
                <tr key={pred.id} className={pred.actual_pts !== null ? 'has-results' : ''}>
                  <td className="player-name">
                    {pred.first_name} {pred.last_name}
                    <span className="position">{pred.position}</span>
                  </td>
                  <td>{pred.team_abbreviation}</td>
                  <td>
                    <span className="predicted">{pred.predicted_pts?.toFixed(1)}</span>
                    {pred.actual_pts !== null && (
                      <span className="actual"> / {pred.actual_pts?.toFixed(1)}</span>
                    )}
                  </td>
                  <td>
                    <span className="predicted">{pred.predicted_reb?.toFixed(1)}</span>
                    {pred.actual_reb !== null && (
                      <span className="actual"> / {pred.actual_reb?.toFixed(1)}</span>
                    )}
                  </td>
                  <td>
                    <span className="predicted">{pred.predicted_ast?.toFixed(1)}</span>
                    {pred.actual_ast !== null && (
                      <span className="actual"> / {pred.actual_ast?.toFixed(1)}</span>
                    )}
                  </td>
                  <td>
                    <span className={`confidence ${pred.confidence > 0.7 ? 'high' : pred.confidence > 0.5 ? 'medium' : 'low'}`}>
                      {Math.round(pred.confidence * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-view">
      <div className="historical-header">
        <h2>Historical Predictions</h2>
        <span className="history-subtitle">{dateList.length} days of data</span>
      </div>
      
      <div className="date-list">
        {dateList.length === 0 ? (
          <div className="empty-state">No historical predictions yet</div>
        ) : (
          dateList.map(date => {
            const entry = groupedByDate[date];
            const acc = getAccuracyForDate(date);
            const games = entry?.predictions ? 
              new Set(entry.predictions.map(p => p.team_abbreviation)).size / 2 : 0;
            
            return (
              <div 
                key={date} 
                className="date-row"
                onClick={() => handleDateClick(date)}
              >
                <div className="date-info">
                  <span className="date">{formatDate(date)}</span>
                  <span className="full-date">{formatFullDate(date)}</span>
                </div>
                <div className="games-count">
                  {Math.round(games)} games
                </div>
                <div className="predictions-count">
                  {entry?.predictions.length || 0} predictions
                </div>
                <div className="accuracy-info">
                  {acc ? (
                    <>
                      <span className="confidence-badge">
                        {Math.round(acc.avg_confidence * 100)}% conf
                      </span>
                    </>
                  ) : (
                    <span className="no-data">No accuracy data</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
