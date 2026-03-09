/**
 * Game-wide constants for Neon Pinball.
 * Adjust these to tweak physics, layout, and scoring.
 */

// ─── Canvas / Table dimensions ────────────────────────────────────────────────
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 700;

// ─── Ball ─────────────────────────────────────────────────────────────────────
export const BALL_RADIUS = 10;
export const TRAIL_LENGTH = 10;

// ─── Physics ──────────────────────────────────────────────────────────────────
export const BALL_FRICTION = 0.998;       // Per-frame speed multiplier (air resistance)
export const WALL_RESTITUTION = 0.62;     // Normal wall bounciness (< 1 = loses energy)
export const BUMPER_RESTITUTION = 1.45;   // Pop-bumper boost (> 1 = gains energy)
export const SLINGSHOT_RESTITUTION = 1.3; // Slingshot repulsion
export const FLIPPER_THICKNESS = 10;      // Radius of the flipper "capsule" for collisions

// ─── Flippers ─────────────────────────────────────────────────────────────────
export const FLIPPER_ANGULAR_SPEED = 0.30; // rad/frame when activating
export const FLIPPER_RETURN_SPEED = 0.20;  // rad/frame when returning to rest

// Flipper pivot positions (fixed for all difficulty levels)
export const LEFT_PIVOT_X = 100;
export const LEFT_PIVOT_Y = 598;
export const RIGHT_PIVOT_X = 260;
export const RIGHT_PIVOT_Y = 598;

// ─── Difficulty presets ───────────────────────────────────────────────────────
export const DIFFICULTY_SETTINGS = {
  easy: {
    gravity: 0.28,
    maxSpeed: 20,
    lives: 5,
    flipperLength: 78,
    restAngleDeg: 22,     // degrees below horizontal for left flipper at rest
    activeAngleDeg: -30,  // degrees above horizontal when activated
    bumperPoints: 80,
    targetPoints: 200,
    slingshotPoints: 30,
  },
  medium: {
    gravity: 0.38,
    maxSpeed: 23,
    lives: 3,
    flipperLength: 70,
    restAngleDeg: 32,
    activeAngleDeg: -25,
    bumperPoints: 100,
    targetPoints: 250,
    slingshotPoints: 50,
  },
  hard: {
    gravity: 0.50,
    maxSpeed: 26,
    lives: 2,
    flipperLength: 62,
    restAngleDeg: 42,
    activeAngleDeg: -18,
    bumperPoints: 150,
    targetPoints: 350,
    slingshotPoints: 75,
  },
} as const;

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const LEVEL_SCORE_THRESHOLD = 5_000; // Points per level
export const COMBO_TIMEOUT_FRAMES = 180;    // Frames (3 s at 60 fps) until combo resets
export const MAX_MULTIPLIER = 8;

// ─── Ball launch ─────────────────────────────────────────────────────────────
export const LAUNCH_SPEED_MIN = 14;         // Minimum launch speed
export const LAUNCH_SPEED_MAX = 22;         // Maximum launch speed (full charge)
export const LAUNCH_CHARGE_RATE = 0.018;    // Charge gained per frame while held
export const BALL_SPAWN_X = 180;
export const BALL_SPAWN_Y = 560;

// ─── Bumper glow timer ────────────────────────────────────────────────────────
export const BUMPER_LIT_FRAMES = 20;
export const SLINGSHOT_LIT_FRAMES = 12;
export const TARGET_RESET_FRAMES = 180;     // 3 s at 60 fps

// ─── Visual / Neon theme colours ──────────────────────────────────────────────
export const COLOR_BG = '#040010';
export const COLOR_TABLE_BORDER = '#7700ff';
export const COLOR_FLIPPER = '#00e5ff';
export const COLOR_FLIPPER_GLOW = '#00e5ff';
export const COLOR_BALL = '#e0e0ff';
export const COLOR_BALL_GLOW = '#8888ff';
export const COLOR_TRAIL = '#6644ff';

export const BUMPER_COLORS: Array<[string, string]> = [
  ['#ff00ff', '#ff44ff'],  // magenta
  ['#ff6600', '#ff9933'],  // orange
  ['#00ffcc', '#44ffdd'],  // teal
  ['#ffff00', '#ffff66'],  // yellow
  ['#ff0066', '#ff4499'],  // hot pink
];

export const TARGET_COLORS = ['#ff00aa', '#00ffff', '#ffcc00'];
