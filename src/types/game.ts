/**
 * Core TypeScript types for the Neon Pinball game.
 * All game objects and state shapes are defined here.
 */

export type GameStatus = 'start' | 'launching' | 'playing' | 'paused' | 'gameover';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Simple 2D position snapshot stored in ball trail */
export interface TrailPoint {
  x: number;
  y: number;
}

/** The main ball object */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: TrailPoint[];
}

/** A flipper (left or right) controlled by the player */
export interface Flipper {
  pivotX: number;
  pivotY: number;
  length: number;
  angle: number;        // Current angle in radians from positive x-axis
  restAngle: number;    // Down/resting position angle
  activeAngle: number;  // Up/activated position angle
  angularVel: number;   // Angular velocity this frame (rad/frame)
  isLeft: boolean;
  active: boolean;      // Whether the flipper key/button is held
}

/** A circular pop-bumper that repels the ball and awards points */
export interface Bumper {
  x: number;
  y: number;
  radius: number;
  points: number;
  lit: boolean;         // True when recently hit (for glow effect)
  litTimer: number;     // Frames remaining in lit state
  color: string;        // Main fill color
  glowColor: string;    // Shadow/glow color
}

/** A line-segment wall — can optionally act as a slingshot */
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isSlingshot?: boolean;
  lit?: boolean;        // Slingshot activation flash
  litTimer?: number;
}

/** A small circular target that awards bonus points when hit, then resets */
export interface Target {
  x: number;
  y: number;
  radius: number;
  points: number;
  hit: boolean;         // True while in cooldown after being hit
  hitTimer: number;     // Frames until reset
  color: string;
}

/** Full internal game state stored in a ref (mutated each frame) */
export interface InternalGameState {
  status: GameStatus;
  difficulty: Difficulty;
  score: number;
  lives: number;
  level: number;
  multiplier: number;
  highScore: number;
  ball: Ball;
  flippers: [Flipper, Flipper];
  bumpers: Bumper[];
  walls: Wall[];
  targets: Target[];
  launchCharge: number;   // 0–1 charge level for ball launch
  launchHeld: boolean;    // Is launch key held
  combo: number;          // Consecutive hits without drain
  comboTimer: number;     // Frames until combo resets
  gravity: number;        // Pixels/frame² (varies with difficulty)
  maxSpeed: number;       // Maximum ball speed cap
}

/** Lightweight snapshot synced to React state for UI rendering */
export interface UISnapshot {
  status: GameStatus;
  score: number;
  lives: number;
  level: number;
  multiplier: number;
  highScore: number;
  combo: number;
  launchCharge: number;
}
