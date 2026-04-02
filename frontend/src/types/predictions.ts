export interface SeasonAverages {
  pts: number;
  reb: number;
  ast: number;
  stl?: number;
  blk?: number;
  threes?: number;
}

export interface Game {
  id: number;
  homeTeam: string;
  homeAbbr: string;
  visitorTeam: string;
  visitorAbbr: string;
  homeScore: number | null;
  visitorScore: number | null;
  status: string;
}

export interface BestBet {
  stat: string;
  recommendation: string;
  line: number;
  probability: number;
  edge: number;
  overPayout?: number;
  underPayout?: number;
}

export interface PlayerPrediction {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  position: string;
  predictedPts: number;
  predictedReb: number;
  predictedAst: number;
  predictedStl: number;
  predictedBlk: number;
  predictedThrees: number;
  confidence: number;
  seasonAverages?: SeasonAverages;
  distributions?: {
    pts: { mean: number; stdDev: number };
    reb: { mean: number; stdDev: number };
    ast: { mean: number; stdDev: number };
  };
  bestBets?: BestBet[];
}

export interface PredictionsResponse {
  gameDate: string;
  games: Game[];
  predictions: PlayerPrediction[];
  topPlayers: PlayerPrediction[];
  totalPlayers: number;
  totalWithStats: number;
  message?: string;
}