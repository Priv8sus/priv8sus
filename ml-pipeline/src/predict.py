#!/usr/bin/env python3
"""
NBA Player Stats Prediction Model
Uses historical averages, recent form, and opponent strength to predict player stats.
Outputs in format: {player_id: {stat: {predicted: X, probability: Y}}}
"""

import sqlite3
import json
import pickle
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import pandas as pd
import numpy as np
from scipy import stats

DB_PATH = Path(__file__).parent.parent.parent / "api" / "data" / "predictions.db"
MODELS_DIR = Path(__file__).parent.parent / "models"
MODEL_PATH = MODELS_DIR / 'stat_models.pkl'


def get_db_connection():
    """Get database connection."""
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def load_models() -> Optional[Dict]:
    """Load trained models from disk."""
    if not MODEL_PATH.exists():
        return None
    with open(MODEL_PATH, 'rb') as f:
        model_data = pickle.load(f)
    return model_data['models']


def fetch_player_season_averages(conn: sqlite3.Connection) -> pd.DataFrame:
    """Fetch player season averages from database."""
    query = """
    SELECT 
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.team_abbreviation,
        p.position,
        s.games_played,
        s.pts_avg,
        s.reb_avg,
        s.ast_avg,
        s.stl_avg,
        s.blk_avg,
        s.fg3_pct,
        s.min_avg
    FROM players p
    LEFT JOIN season_stats s ON p.id = s.player_id
    WHERE s.games_played > 0
    """
    return pd.read_sql_query(query, conn)


def fetch_player_conditions(conn: sqlite3.Connection, player_id: int, game_date: str) -> Dict:
    """Fetch player conditions for a specific game."""
    query = """
    SELECT * FROM player_conditions
    WHERE player_id = ? AND game_date <= ?
    ORDER BY game_date DESC
    LIMIT 1
    """
    df = pd.read_sql_query(query, conn, params=[player_id, game_date])
    if df.empty:
        return {
            'injury_status': None,
            'is_back_to_back': 0,
            'rest_days': 3,
            'condition_score': 0.5
        }
    
    latest = df.iloc[0]
    return {
        'injury_status': latest.get('injury_status'),
        'is_back_to_back': latest.get('is_back_to_back', 0),
        'rest_days': latest.get('rest_days', 3),
        'condition_score': latest.get('condition_score', 0.5)
    }


def calculate_recent_form_factors(conn: sqlite3.Connection, player_id: int) -> Dict[str, float]:
    """Calculate recent form factors based on prediction accuracy."""
    query = """
    SELECT 
        AVG(predicted_pts) as avg_predicted,
        AVG(actual_pts) as avg_actual,
        COUNT(*) as n_games
    FROM predictions
    WHERE player_id = ? AND actual_pts IS NOT NULL
    """
    df = pd.read_sql_query(query, conn, params=[player_id])
    
    if df.empty or df.iloc[0]['n_games'] == 0:
        return {
            'pts_factor': 1.0,
            'reb_factor': 1.0,
            'ast_factor': 1.0,
            'stl_factor': 1.0,
            'blk_factor': 1.0,
        }
    
    row = df.iloc[0]
    if row['n_games'] < 3 or row['avg_predicted'] == 0:
        return {
            'pts_factor': 1.0,
            'reb_factor': 1.0,
            'ast_factor': 1.0,
            'stl_factor': 1.0,
            'blk_factor': 1.0,
        }
    
    ratio = row['avg_actual'] / row['avg_predicted']
    ratio = max(0.5, min(1.5, ratio))
    
    return {
        'pts_factor': ratio,
        'reb_factor': ratio,
        'ast_factor': ratio,
        'stl_factor': ratio,
        'blk_factor': ratio,
    }


def calculate_opponent_strength_factors(conn: sqlite3.Connection, opponent_team: str) -> Dict[str, float]:
    """Calculate opponent defensive strength factors."""
    query = """
    SELECT 
        AVG(actual_pts) as avg_pts_allowed,
        AVG(actual_reb) as avg_reb_allowed,
        AVG(actual_ast) as avg_ast_allowed
    FROM predictions pred
    JOIN players p ON pred.player_id = p.id
    WHERE p.team_abbreviation = ?
      AND actual_pts IS NOT NULL
    """
    
    if not opponent_team:
        return {
            'pts_factor': 1.0,
            'reb_factor': 1.0,
            'ast_factor': 1.0,
            'stl_factor': 1.0,
            'blk_factor': 1.0,
        }
    
    df = pd.read_sql_query(query, conn, params=[opponent_team])
    
    if df.empty:
        return {
            'pts_factor': 1.0,
            'reb_factor': 1.0,
            'ast_factor': 1.0,
            'stl_factor': 1.0,
            'blk_factor': 1.0,
        }
    
    row = df.iloc[0]
    league_avg_pts = 105.0
    league_avg_reb = 45.0
    league_avg_ast = 25.0
    
    pts_factor = league_avg_pts / max(row['avg_pts_allowed'], 1)
    reb_factor = league_avg_reb / max(row['avg_reb_allowed'], 1)
    ast_factor = league_avg_ast / max(row['avg_ast_allowed'], 1)
    
    pts_factor = max(0.8, min(1.2, pts_factor))
    reb_factor = max(0.8, min(1.2, reb_factor))
    ast_factor = max(0.8, min(1.2, ast_factor))
    
    return {
        'pts_factor': pts_factor,
        'reb_factor': reb_factor,
        'ast_factor': ast_factor,
        'stl_factor': 1.0,
        'blk_factor': 1.0,
    }


def engineer_features(
    player_row: pd.Series,
    recent_form: Dict[str, float],
    opponent_strength: Dict[str, float],
    conditions: Dict
) -> np.ndarray:
    """Engineer feature vector from player data and contextual factors."""
    games_played = player_row.get('games_played', 0)
    
    pts_avg = player_row.get('pts_avg', 0)
    reb_avg = player_row.get('reb_avg', 0)
    ast_avg = player_row.get('ast_avg', 0)
    stl_avg = player_row.get('stl_avg', 0)
    blk_avg = player_row.get('blk_avg', 0)
    fg3_pct = player_row.get('fg3_pct', 0.35)
    
    features = [
        pts_avg,
        reb_avg,
        ast_avg,
        stl_avg,
        blk_avg,
        fg3_pct,
        games_played,
        recent_form.get('pts_factor', 1.0),
        recent_form.get('reb_factor', 1.0),
        recent_form.get('ast_factor', 1.0),
        recent_form.get('stl_factor', 1.0),
        recent_form.get('blk_factor', 1.0),
        opponent_strength.get('pts_factor', 1.0),
        opponent_strength.get('reb_factor', 1.0),
        opponent_strength.get('ast_factor', 1.0),
        opponent_strength.get('stl_factor', 1.0),
        opponent_strength.get('blk_factor', 1.0),
        conditions.get('condition_score', 0.5),
        conditions.get('rest_days', 3),
        conditions.get('is_back_to_back', 0),
    ]
    
    return np.array(features)


def predict_player_stats_ml(
    player: pd.Series,
    models: Dict,
    recent_form: Dict[str, float],
    opponent_strength: Dict[str, float],
    conditions: Dict
) -> Dict:
    """Predict player stats using ML models."""
    features = engineer_features(player, recent_form, opponent_strength, conditions)
    
    predictions = {}
    stat_names = ['pts', 'reb', 'ast', 'stl', 'blk', 'threes']
    
    for stat_name in stat_names:
        model = models.get(stat_name)
        if model is not None and hasattr(model, 'fitted_') and model.fitted_:
            pred = model.predict(features.reshape(1, -1))[0]
            pred = max(0, pred)
        else:
            base_values = {
                'pts': player.get('pts_avg', 0),
                'reb': player.get('reb_avg', 0),
                'ast': player.get('ast_avg', 0),
                'stl': player.get('stl_avg', 0),
                'blk': player.get('blk_avg', 0),
                'threes': estimate_threes(player.get('fg3_pct', 0.35)),
            }
            form_factors = {
                'pts': recent_form.get('pts_factor', 1.0),
                'reb': recent_form.get('reb_factor', 1.0),
                'ast': recent_form.get('ast_factor', 1.0),
                'stl': recent_form.get('stl_factor', 1.0),
                'blk': recent_form.get('blk_factor', 1.0),
                'threes': recent_form.get('pts_factor', 1.0),
            }
            opp_factors = {
                'pts': opponent_strength.get('pts_factor', 1.0),
                'reb': opponent_strength.get('reb_factor', 1.0),
                'ast': opponent_strength.get('ast_factor', 1.0),
                'stl': opponent_strength.get('stl_factor', 1.0),
                'blk': opponent_strength.get('blk_factor', 1.0),
                'threes': opponent_strength.get('pts_factor', 1.0),
            }
            pred = base_values[stat_name] * form_factors[stat_name] * opp_factors[stat_name]
            pred = max(0, pred)
        
        predictions[stat_name] = round(float(pred), 1)
    
    return predictions


def predict_player_stats_baseline(
    player: pd.Series,
    recent_form: Dict[str, float],
    opponent_strength: Dict[str, float]
) -> Dict:
    """Predict player stats using baseline formula."""
    stat_preds = {}
    
    for stat, factor_key in [
        ('pts', 'pts_factor'),
        ('reb', 'reb_factor'),
        ('ast', 'ast_factor'),
        ('stl', 'stl_factor'),
        ('blk', 'blk_factor'),
    ]:
        base_val = player.get(f'{stat}_avg', 0) if stat != 'pts' else player.get('pts_avg', 0)
        form_factor = recent_form.get(factor_key, 1.0)
        opp_factor = opponent_strength.get(factor_key, 1.0)
        stat_preds[stat] = max(0, base_val * form_factor * opp_factor)
    
    stat_preds['threes'] = estimate_threes(player.get('fg3_pct', 0.35))
    
    return {k: round(float(v), 1) for k, v in stat_preds.items()}


def estimate_threes(fg3_pct: float) -> float:
    """Estimate 3-pointers based on FG3%."""
    if pd.isna(fg3_pct):
        fg3_pct = 0.35
    if fg3_pct > 0.38:
        return 2.5
    elif fg3_pct > 0.34:
        return 1.8
    elif fg3_pct > 0.30:
        return 1.2
    else:
        return 0.7


def calculate_variance(mean: float, stat_type: str, games_played: int) -> float:
    """Calculate variance for a stat based on historical patterns."""
    variance_coeffs = {
        'pts': 0.35,
        'reb': 0.40,
        'ast': 0.45,
        'stl': 0.55,
        'blk': 0.60,
        'threes': 0.50,
    }
    
    coeff = variance_coeffs.get(stat_type, 0.40)
    std_dev = mean * coeff
    
    if games_played > 0:
        sample_factor = np.sqrt(30 / max(games_played, 1))
        std_dev *= min(sample_factor, 1.5)
    
    min_std = {'pts': 2.0, 'reb': 1.0, 'ast': 0.8, 'stl': 0.4, 'blk': 0.3, 'threes': 0.5}
    std_dev = max(std_dev, min_std.get(stat_type, 0.5))
    
    return std_dev ** 2


def calculate_probability(
    predicted: float,
    stat_type: str,
    games_played: int
) -> Dict[str, float]:
    """Calculate probability distribution for a predicted stat.
    
    Returns probability of exceeding common betting lines.
    """
    variance = calculate_variance(predicted, stat_type, games_played)
    std_dev = np.sqrt(variance) if variance > 0 else 0.1
    
    discrete_stats = ['stl', 'blk', 'threes']
    
    lines = {
        'pts': [10, 15, 20, 25, 30],
        'reb': [4, 6, 8, 10],
        'ast': [3, 5, 7, 9],
        'stl': [0.5, 1, 1.5, 2],
        'blk': [0.5, 1, 1.5, 2],
        'threes': [1, 2, 3, 4],
    }
    
    probs = {}
    stat_lines = lines.get(stat_type, [])
    
    for line in stat_lines:
        if stat_type in discrete_stats:
            lambda_param = max(predicted, 0.1)
            over_prob = 1 - stats.poisson.cdf(line, lambda_param)
        else:
            over_prob = 1 - stats.norm.cdf(line, predicted, std_dev)
        
        over_prob = max(0, min(1, over_prob))
        under_prob = 1 - over_prob
        
        probs[f'over_{line}'] = round(over_prob, 4)
        probs[f'under_{line}'] = round(under_prob, 4)
    
    return probs


def calculate_confidence(games_played: int) -> float:
    """Calculate confidence score based on games played."""
    if games_played <= 0:
        return 0.05
    elif games_played < 10:
        return round(0.2 + (games_played / 10) * 0.3, 2)
    elif games_played < 30:
        return round(0.5 + ((games_played - 10) / 20) * 0.2, 2)
    elif games_played < 50:
        return round(0.7 + ((games_played - 30) / 20) * 0.15, 2)
    else:
        return round(min(0.95, 0.85 + (games_played / 82) * 0.1), 2)


def generate_predictions(game_date: Optional[str] = None) -> Dict:
    """Generate predictions for all players.
    
    Output format: {player_id: {stat: {predicted: X, probability: Y}}}
    """
    if game_date is None:
        game_date = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_db_connection()
    
    try:
        players_df = fetch_player_season_averages(conn)
        models = load_models()
        
        if players_df.empty:
            return {
                'game_date': game_date,
                'predictions': {},
                'message': 'No player data available'
            }
        
        predictions = {}
        
        for _, player in players_df.iterrows():
            player_id = int(player['player_id'])
            
            recent_form = calculate_recent_form_factors(conn, player_id)
            opponent_strength = calculate_opponent_strength_factors(conn, '')
            conditions = fetch_player_conditions(conn, player_id, game_date)
            
            if models:
                stat_predictions = predict_player_stats_ml(
                    player, models, recent_form, opponent_strength, conditions
                )
            else:
                stat_predictions = predict_player_stats_baseline(
                    player, recent_form, opponent_strength
                )
            
            games_played = player.get('games_played', 0)
            confidence = calculate_confidence(games_played)
            
            player_predictions = {}
            for stat, predicted in stat_predictions.items():
                probs = calculate_probability(predicted, stat, games_played)
                player_predictions[stat] = {
                    'predicted': predicted,
                    'probability': probs,
                    'confidence': confidence
                }
            
            predictions[player_id] = player_predictions
        
        return {
            'game_date': game_date,
            'predictions': predictions,
            'total_players': len(predictions),
            'timestamp': datetime.now().isoformat(),
            'model_type': 'ml' if models else 'baseline'
        }
    
    finally:
        conn.close()


def save_predictions_to_db(conn: sqlite3.Connection, predictions: Dict, game_date: str) -> None:
    """Save predictions to database for future model training."""
    cursor = conn.cursor()
    
    for player_id, stats in predictions.items():
        pts_pred = stats.get('pts', {}).get('predicted', 0)
        reb_pred = stats.get('reb', {}).get('predicted', 0)
        ast_pred = stats.get('ast', {}).get('predicted', 0)
        stl_pred = stats.get('stl', {}).get('predicted', 0)
        blk_pred = stats.get('blk', {}).get('predicted', 0)
        threes_pred = stats.get('threes', {}).get('predicted', 0)
        conf = stats.get('pts', {}).get('confidence', 0.5)
        
        cursor.execute("""
            INSERT INTO predictions (
                player_id, game_date, predicted_pts, predicted_reb, predicted_ast,
                predicted_stl, predicted_blk, predicted_threes, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (player_id, game_date, pts_pred, reb_pred, ast_pred,
              stl_pred, blk_pred, threes_pred, conf))
    
    conn.commit()


def main():
    """Main entry point for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate NBA player predictions')
    parser.add_argument('--date', type=str, help='Game date (YYYY-MM-DD format)')
    parser.add_argument('--output', type=str, help='Output file path (default: stdout)')
    parser.add_argument('--save', action='store_true', help='Save predictions to database')
    
    args = parser.parse_args()
    
    try:
        result = generate_predictions(args.date)
        
        output = json.dumps(result, indent=2)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
            print(f"Predictions written to {args.output}")
        else:
            print(output)
        
        if args.save:
            conn = get_db_connection()
            try:
                save_predictions_to_db(conn, result['predictions'], result['game_date'])
                print(f"Predictions saved to database for {result['game_date']}")
            finally:
                conn.close()
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    import sys
    main()