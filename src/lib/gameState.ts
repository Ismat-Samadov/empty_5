/**
 * Factory functions for creating the initial game state.
 * Defines the pinball table layout: walls, bumpers, targets, and flippers.
 */

import type { Ball, Bumper, Flipper, InternalGameState, Target, Wall } from '@/types/game';
import type { Difficulty } from '@/types/game';
import {
  BALL_RADIUS,
  BALL_SPAWN_X,
  BALL_SPAWN_Y,
  BUMPER_COLORS,
  DIFFICULTY_SETTINGS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LEFT_PIVOT_X,
  LEFT_PIVOT_Y,
  RIGHT_PIVOT_X,
  RIGHT_PIVOT_Y,
  TARGET_COLORS,
  TARGET_RESET_FRAMES,
} from './constants';

// ─── Ball ─────────────────────────────────────────────────────────────────────

function createBall(): Ball {
  return {
    x: BALL_SPAWN_X,
    y: BALL_SPAWN_Y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    trail: [],
  };
}

// ─── Flippers ─────────────────────────────────────────────────────────────────

function createFlippers(difficulty: Difficulty): [Flipper, Flipper] {
  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const restRad = (cfg.restAngleDeg * Math.PI) / 180;
  const activeRad = (cfg.activeAngleDeg * Math.PI) / 180;

  const left: Flipper = {
    pivotX: LEFT_PIVOT_X,
    pivotY: LEFT_PIVOT_Y,
    length: cfg.flipperLength,
    angle: restRad,
    restAngle: restRad,
    activeAngle: activeRad,
    angularVel: 0,
    isLeft: true,
    active: false,
  };

  // Right flipper mirror: rest angle is π - restRad, active is π - activeRad
  const right: Flipper = {
    pivotX: RIGHT_PIVOT_X,
    pivotY: RIGHT_PIVOT_Y,
    length: cfg.flipperLength,
    angle: Math.PI - restRad,
    restAngle: Math.PI - restRad,
    activeAngle: Math.PI - activeRad,
    angularVel: 0,
    isLeft: false,
    active: false,
  };

  return [left, right];
}

// ─── Walls ────────────────────────────────────────────────────────────────────

function createWalls(difficulty: Difficulty): Wall[] {
  const lx = 20;  // left wall x
  const rx = GAME_WIDTH - 20; // right wall x
  const topY = 55;

  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const flipperLen = cfg.flipperLength;
  const restRad = (cfg.restAngleDeg * Math.PI) / 180;

  // Compute where left flipper tip rests (for the guide walls)
  const leftTipX = LEFT_PIVOT_X + flipperLen * Math.cos(restRad);
  const rightTipX = RIGHT_PIVOT_X + flipperLen * Math.cos(Math.PI - restRad);

  const walls: Wall[] = [
    // Left wall
    { x1: lx, y1: topY, x2: lx, y2: 500 },
    // Right wall
    { x1: rx, y1: topY, x2: rx, y2: 500 },
    // Top wall (flat)
    { x1: lx, y1: topY, x2: rx, y2: topY },

    // ── Slingshots (angled walls with extra repulsion) ──────────────────────
    // Left slingshot upper edge
    { x1: lx, y1: 380, x2: 82, y2: 420, isSlingshot: true, lit: false, litTimer: 0 },
    // Left slingshot lower edge
    { x1: lx, y1: 500, x2: 82, y2: 460, isSlingshot: true, lit: false, litTimer: 0 },
    // Right slingshot upper edge
    { x1: rx, y1: 380, x2: GAME_WIDTH - 82, y2: 420, isSlingshot: true, lit: false, litTimer: 0 },
    // Right slingshot lower edge
    { x1: rx, y1: 500, x2: GAME_WIDTH - 82, y2: 460, isSlingshot: true, lit: false, litTimer: 0 },

    // ── Bottom guide walls (funnel ball to flippers) ─────────────────────────
    // Left guide: left wall bottom → left flipper pivot
    { x1: lx, y1: 500, x2: LEFT_PIVOT_X, y2: LEFT_PIVOT_Y },
    // Right guide: right wall bottom → right flipper pivot
    { x1: rx, y1: 500, x2: RIGHT_PIVOT_X, y2: RIGHT_PIVOT_Y },

    // ── Flipper lane divider walls (short walls just inside each flipper) ───
    { x1: leftTipX + 5, y1: LEFT_PIVOT_Y + 5, x2: leftTipX + 5, y2: GAME_HEIGHT - 10 },
    { x1: rightTipX - 5, y1: RIGHT_PIVOT_Y + 5, x2: rightTipX - 5, y2: GAME_HEIGHT - 10 },
  ];

  return walls;
}

// ─── Bumpers ──────────────────────────────────────────────────────────────────

function createBumpers(difficulty: Difficulty): Bumper[] {
  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const pts = cfg.bumperPoints;

  const defs: Array<{ x: number; y: number; r: number; colorIdx: number }> = [
    { x: 180, y: 175, r: 20, colorIdx: 0 }, // centre (magenta)
    { x: 115, y: 255, r: 18, colorIdx: 1 }, // left-mid (orange)
    { x: 245, y: 255, r: 18, colorIdx: 2 }, // right-mid (teal)
    { x: 88,  y: 165, r: 15, colorIdx: 3 }, // far-left (yellow)
    { x: 272, y: 165, r: 15, colorIdx: 4 }, // far-right (pink)
  ];

  return defs.map(({ x, y, r, colorIdx }) => {
    const [color, glowColor] = BUMPER_COLORS[colorIdx];
    return { x, y, radius: r, points: pts, lit: false, litTimer: 0, color, glowColor };
  });
}

// ─── Targets ──────────────────────────────────────────────────────────────────

function createTargets(difficulty: Difficulty): Target[] {
  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const pts = cfg.targetPoints;

  const defs: Array<{ x: number; y: number; colorIdx: number }> = [
    { x: 130, y: 120, colorIdx: 0 },
    { x: 180, y: 105, colorIdx: 1 },
    { x: 230, y: 120, colorIdx: 2 },
  ];

  return defs.map(({ x, y, colorIdx }) => ({
    x,
    y,
    radius: 10,
    points: pts,
    hit: false,
    hitTimer: 0,
    color: TARGET_COLORS[colorIdx],
  }));
}

// ─── Full state factory ───────────────────────────────────────────────────────

export function createInitialState(
  difficulty: Difficulty,
  highScore: number,
): InternalGameState {
  const cfg = DIFFICULTY_SETTINGS[difficulty];

  return {
    status: 'launching',
    difficulty,
    score: 0,
    lives: cfg.lives,
    level: 1,
    multiplier: 1,
    highScore,
    ball: createBall(),
    flippers: createFlippers(difficulty),
    bumpers: createBumpers(difficulty),
    walls: createWalls(difficulty),
    targets: createTargets(difficulty),
    launchCharge: 0,
    launchHeld: false,
    combo: 0,
    comboTimer: 0,
    gravity: cfg.gravity,
    maxSpeed: cfg.maxSpeed,
  };
}

/**
 * Resets only the ball and launch state after a life is lost.
 * Preserves score, level, etc.
 */
export function resetBallForLaunch(state: InternalGameState): void {
  state.ball = createBall();
  state.launchCharge = 0;
  state.launchHeld = false;
  state.status = 'launching';

  // Reset targets (give player a break)
  state.targets.forEach(t => { t.hit = false; t.hitTimer = 0; });
}
