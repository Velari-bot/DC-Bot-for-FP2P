/**
 * Type definitions for gameplay analysis
 */

export interface AnalyzeRequest {
  file: Express.Multer.File;
  type: 'replay' | 'clip';
  player_id: string;
  start_time?: number;
  end_time?: number;
  playstyle_id?: string;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  error?: string;
  analysis?: AnalysisResult;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  drills: Drill[];
  events: GameEvent[];
  metrics: Metrics;
  jump_timestamps: JumpTimestamp[];
}

export interface Drill {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameEvent {
  id: string;
  type: 'fight' | 'rotation' | 'loot' | 'healing' | 'storm' | 'building';
  start_time: number;
  end_time?: number;
  duration?: number;
  outcome?: 'won' | 'lost' | 'disengaged';
  damage_dealt?: number;
  damage_taken?: number;
  highground?: 'gained' | 'lost' | 'maintained';
  weapons?: string[];
  notes?: string[];
  location?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Metrics {
  total_damage: number;
  avg_fight_duration: number;
  fight_win_rate: number;
  avg_accuracy: number;
  times_in_storm: number;
  loot_efficiency_score: number;
  total_fights: number;
  total_kills: number;
  total_deaths: number;
}

export interface JumpTimestamp {
  label: string;
  time: number;
}

export interface ParsedReplayData {
  player_id: string;
  events: RawEvent[];
  duration: number;
  metadata?: {
    total_players?: number;
    total_kills?: number;
    game_mode?: string;
    map_name?: string;
    match_id?: string;
    players?: Array<{
      id: string;
      name: string;
      teamId: number;
      kills: number;
      damage: number;
    }>;
    parser_note?: string;
  };
}

export interface RawEvent {
  timestamp: number;
  type: string;
  data: any;
}

export interface FightEvent extends GameEvent {
  type: 'fight';
  opponent_count?: number;
  healing_used?: boolean;
  building_used?: boolean;
}

export interface RotationEvent extends GameEvent {
  type: 'rotation';
  storm_damage?: number;
  late_rotation?: boolean;
}

