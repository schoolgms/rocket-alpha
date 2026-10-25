import * as THREE from 'three';
import { StadiumType } from '../arena/ArenaTypes';
import { BotDifficulty } from '../ai/BotController';
import { CarCustomization } from '../garage/GarageTypes';

export type GameMode = 'freeplay' | 'offline' | 'training' | 'online';
export type TrainingDrill = 'striker' | 'goalie' | 'aerial';
export type MatchPhase = 'countdown' | 'playing' | 'goal_scored' | 'celebration' | 'ended';

export interface MatchConfig {
  mode: GameMode;
  stadium: StadiumType;
  teamSize: 1 | 2 | 3;
  durationMinutes: number; // e.g. 3, 5
  botDifficulty: BotDifficulty;
  trainingDrill?: TrainingDrill;
  playerCustomization: CarCustomization;
}

export interface MatchStats {
  goals: number;
  shots: number;
  saves: number;
  boostUsed: number;
}

export class MatchManager {
  public config: MatchConfig;
  public phase: MatchPhase = 'countdown';
  
  public timeRemaining = 300; // in seconds
  public isOvertime = false;
  public blueScore = 0;
  public orangeScore = 0;
  
  public countdownTimer = 3.99; // 3, 2, 1, GO
  public celebrationTimer = 0;
  
  public lastGoalScorer = '';
  public lastGoalTeam: 'blue' | 'orange' = 'blue';
  public lastGoalSpeed = 0;

  public playerStats: MatchStats = {
    goals: 0,
    shots: 0,
    saves: 0,
    boostUsed: 0,
  };

  // Callback hooks
  public onCountdownTick?: (count: number | 'GO') => void;
  public onGoal?: (scorer: string, team: 'blue' | 'orange', speed: number) => void;
  public onMatchEnd?: (winner: 'blue' | 'orange' | 'draw') => void;

  constructor(config: MatchConfig) {
    this.config = config;
    this.initMatch();
  }

  public initMatch() {
    this.blueScore = 0;
    this.orangeScore = 0;
    this.isOvertime = false;
    this.timeRemaining = this.config.mode === 'freeplay' ? 99999 : this.config.durationMinutes * 60;
    this.phase = this.config.mode === 'freeplay' ? 'playing' : 'countdown';
    this.countdownTimer = 3.99;
    this.celebrationTimer = 0;
    this.playerStats = { goals: 0, shots: 0, saves: 0, boostUsed: 0 };
  }

  public update(dt: number): { shouldResetPositions: boolean; matchEnded: boolean } {
    let shouldResetPositions = false;
    let matchEnded = false;

    if (this.phase === 'countdown') {
      const prevInt = Math.floor(this.countdownTimer);
      this.countdownTimer -= dt;
      const currentInt = Math.floor(this.countdownTimer);

      if (this.countdownTimer <= 0) {
        this.phase = 'playing';
        if (this.onCountdownTick) this.onCountdownTick('GO');
      } else if (currentInt !== prevInt && currentInt >= 1) {
        if (this.onCountdownTick) this.onCountdownTick(currentInt);
      }
    } else if (this.phase === 'playing') {
      if (this.config.mode !== 'freeplay') {
        if (!this.isOvertime) {
          this.timeRemaining = Math.max(0, this.timeRemaining - dt);
          if (this.timeRemaining <= 0) {
            // Check overtime or match end
            if (this.blueScore === this.orangeScore) {
              this.isOvertime = true;
            } else {
              this.phase = 'ended';
              matchEnded = true;
              const winner = this.blueScore > this.orangeScore ? 'blue' : 'orange';
              if (this.onMatchEnd) this.onMatchEnd(winner);
            }
          }
        } else {
          // In Overtime: timer counts UP for tension
          this.timeRemaining += dt;
        }
      }
    } else if (this.phase === 'celebration') {
      this.celebrationTimer -= dt;
      if (this.celebrationTimer <= 0) {
        if (this.isOvertime) {
          // Sudden death goal scored! Match ends immediately
          this.phase = 'ended';
          matchEnded = true;
          const winner = this.blueScore > this.orangeScore ? 'blue' : 'orange';
          if (this.onMatchEnd) this.onMatchEnd(winner);
        } else {
          // Return to kickoff
          this.phase = 'countdown';
          this.countdownTimer = 3.99;
          shouldResetPositions = true;
        }
      }
    }

    return { shouldResetPositions, matchEnded };
  }

  public registerGoal(team: 'blue' | 'orange', scorer: string, speed: number) {
    if (this.phase !== 'playing') return;

    if (team === 'blue') {
      this.blueScore++;
      if (this.config.playerCustomization.team === 'blue' && scorer === this.config.playerCustomization.playerName) {
        this.playerStats.goals++;
      }
    } else {
      this.orangeScore++;
      if (this.config.playerCustomization.team === 'orange' && scorer === this.config.playerCustomization.playerName) {
        this.playerStats.goals++;
      }
    }

    this.lastGoalTeam = team;
    this.lastGoalScorer = scorer || (team === 'blue' ? 'Blue Team' : 'Orange Team');
    this.lastGoalSpeed = Math.max(35, speed);

    this.phase = 'celebration';
    this.celebrationTimer = 3.8; // 3.8s celebration camera

    if (this.onGoal) {
      this.onGoal(this.lastGoalScorer, team, this.lastGoalSpeed);
    }
  }

  public formatTime(): string {
    if (this.config.mode === 'freeplay') return '∞';
    const totalSecs = Math.max(0, Math.floor(this.timeRemaining));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const prefix = this.isOvertime ? '+' : '';
    return `${prefix}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Spawns kickoff positions for Blue and Orange teams
   */
  public getKickoffPositions(teamSize: number) {
    const blueSpawns: Array<{ x: number; z: number; angle: number }> = [];
    const orangeSpawns: Array<{ x: number; z: number; angle: number }> = [];

    if (teamSize === 1) {
      // 1v1 Center diagonal kickoff
      blueSpawns.push({ x: 0, z: -35, angle: 0 });
      orangeSpawns.push({ x: 0, z: 35, angle: Math.PI });
    } else if (teamSize === 2) {
      // 2v2 Left & Right diagonal
      blueSpawns.push({ x: -18, z: -30, angle: 0.35 });
      blueSpawns.push({ x: 18, z: -30, angle: -0.35 });

      orangeSpawns.push({ x: 18, z: 30, angle: Math.PI - 0.35 });
      orangeSpawns.push({ x: -18, z: 30, angle: Math.PI + 0.35 });
    } else {
      // 3v3 Two diagonals + One goalie
      blueSpawns.push({ x: -18, z: -30, angle: 0.35 });
      blueSpawns.push({ x: 18, z: -30, angle: -0.35 });
      blueSpawns.push({ x: 0, z: -48, angle: 0 });

      orangeSpawns.push({ x: 18, z: 30, angle: Math.PI - 0.35 });
      orangeSpawns.push({ x: -18, z: 30, angle: Math.PI + 0.35 });
      orangeSpawns.push({ x: 0, z: 48, angle: Math.PI });
    }

    return { blueSpawns, orangeSpawns };
  }
}
