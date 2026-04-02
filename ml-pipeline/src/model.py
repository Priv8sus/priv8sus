#!/usr/bin/env python3
"""
NBA Player Stats Prediction Model - ML Training Pipeline
Uses scikit-learn to train prediction models for player stats.
"""

import sqlite3
import json
import pickle
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

DB_PATH = Path(__file__).parent.parent.parent / "api" / "data" / "predictions.db"
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def get_db_connection():
    """Get database connection."""
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def fetch_training_data(conn: sqlite3.Connection) -> pd.DataFrame:
    """Fetch historical prediction data for training."""
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
        s.min_avg,
        pred.game_date,
        pred.actual_pts,
        pred.actual_reb,
        pred.actual_ast,
        pred.actual_stl,
        pred.actual_blk,
        pred.actual_threes
    FROM players p
    LEFT JOIN season_stats s ON p.id = s.player_id
    LEFT JOIN predictions pred ON p.id = pred.player_id
    WHERE pred.actual_pts IS NOT NULL
      AND pred.actual_reb IS NOT NULL
      AND s.games_played > 0
    ORDER BY pred.game_date DESC
    """
    return pd.read_sql_query(query, conn)


def fetch_player_conditions(conn: sqlite3.Connection, player_id: int, game_date: str) -> Dict:
    """Fetch player conditions for a specific game."""
    query = """
    SELECT * FROM player_conditions
    WHERE player_id = ? AND game_date <= ?
    ORDER BY game_date DESC
    LIMIT 10
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


def train_stat_model(
    X: np.ndarray,
    y: np.ndarray,
    stat_name: str
) -> Pipeline:
    """Train a model for a specific stat."""
    if len(X) < 10:
        return None
    
    model = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', GradientBoostingRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=42
        ))
    ])
    
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model.fit(X_train, y_train)
        
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        print(f"  {stat_name} - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
    except Exception as e:
        print(f"  {stat_name} - Training failed: {e}")
        return None
    
    return model


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


def train_models() -> Dict[str, Pipeline]:
    """Train prediction models for all stat types."""
    print("Fetching training data...")
    conn = get_db_connection()
    
    try:
        df = fetch_training_data(conn)
        
        if df.empty:
            print("No training data available. Creating baseline models...")
            return create_baseline_models()
        
        print(f"Found {len(df)} training samples")
        
        stat_models = {}
        stat_names = ['pts', 'reb', 'ast', 'stl', 'blk', 'threes']
        target_cols = ['actual_pts', 'actual_reb', 'actual_ast', 
                       'actual_stl', 'actual_blk', 'actual_threes']
        
        for stat_name, target_col in zip(stat_names, target_cols):
            print(f"\nTraining {stat_name} model...")
            
            X_list = []
            y_list = []
            
            for _, row in df.iterrows():
                recent_form = calculate_recent_form_factors(conn, row['player_id'])
                opponent_strength = calculate_opponent_strength_factors(conn, '')
                conditions = fetch_player_conditions(conn, row['player_id'], row['game_date'])
                
                features = engineer_features(row, recent_form, opponent_strength, conditions)
                X_list.append(features)
                y_list.append(row[target_col])
            
            X = np.array(X_list)
            y = np.array(y_list)
            
            model = train_stat_model(X, y, stat_name)
            if model is not None:
                stat_models[stat_name] = model
        
        if stat_models:
            save_models(stat_models)
        
        return stat_models
    
    finally:
        conn.close()


def create_baseline_models() -> Dict[str, Pipeline]:
    """Create baseline models when no training data is available."""
    stat_models = {}
    
    for stat_name in ['pts', 'reb', 'ast', 'stl', 'blk', 'threes']:
        model = Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', Ridge(alpha=1.0))
        ])
        model.fitted_ = False
        stat_models[stat_name] = model
    
    save_models(stat_models)
    print("Baseline models created and saved.")
    
    return stat_models


def save_models(models: Dict[str, Pipeline]) -> None:
    """Save trained models to disk."""
    model_data = {
        'models': models,
        'metadata': {
            'created_at': datetime.now().isoformat(),
            'stat_types': list(models.keys())
        }
    }
    
    model_path = MODELS_DIR / 'stat_models.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"\nModels saved to {model_path}")


def load_models() -> Optional[Dict[str, Pipeline]]:
    """Load trained models from disk."""
    model_path = MODELS_DIR / 'stat_models.pkl'
    
    if not model_path.exists():
        return None
    
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    return model_data['models']


def main():
    """Main entry point for model training."""
    print("NBA Player Stats Prediction Model Training")
    print("=" * 50)
    
    try:
        models = train_models()
        print(f"\nTraining complete. {len(models)} models trained.")
    except Exception as e:
        print(f"Training failed: {e}")
        raise


if __name__ == '__main__':
    main()