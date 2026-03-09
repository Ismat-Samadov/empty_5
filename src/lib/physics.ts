/**
 * Physics engine for Neon Pinball.
 *
 * Handles:
 *  – Ball vs wall (line-segment) collision with optional slingshot boost
 *  – Ball vs circular bumper / target collision
 *  – Ball vs flipper collision (line-segment + surface velocity contribution)
 *
 * Coordinate system: x right, y DOWN (standard canvas).
 */

import type { Ball, Bumper, Flipper, Target, Wall } from '@/types/game';
import {
  BALL_FRICTION,
  BUMPER_RESTITUTION,
  FLIPPER_ANGULAR_SPEED,
  FLIPPER_RETURN_SPEED,
  FLIPPER_THICKNESS,
  SLINGSHOT_RESTITUTION,
  WALL_RESTITUTION,
} from './constants';

// ─── Vec2 helpers ─────────────────────────────────────────────────────────────

function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

function len(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

/**
 * Returns the point on segment (ax,ay)→(bx,by) closest to (px,py),
 * and the parametric t in [0,1].
 */
function closestOnSegment(
  ax: number, ay: number,
  bx: number, by: number,
  px: number, py: number,
): { qx: number; qy: number; t: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { qx: ax, qy: ay, t: 0 };
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return { qx: ax + t * dx, qy: ay + t * dy, t };
}

// ─── Wall collision ───────────────────────────────────────────────────────────

/**
 * Resolves a ball–wall collision.
 * Returns true if a collision occurred.
 */
export function resolveWallCollision(ball: Ball, wall: Wall): boolean {
  const { qx, qy } = closestOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, ball.x, ball.y);
  const nx = ball.x - qx;
  const ny = ball.y - qy;
  const dist = len(nx, ny);

  if (dist === 0 || dist >= ball.radius) return false;

  // Normalise
  const invDist = 1 / dist;
  const nnx = nx * invDist;
  const nny = ny * invDist;

  // Push ball out of wall
  const penetration = ball.radius - dist;
  ball.x += nnx * penetration;
  ball.y += nny * penetration;

  // Choose restitution
  const restitution = wall.isSlingshot ? SLINGSHOT_RESTITUTION : WALL_RESTITUTION;

  // Reflect velocity component along normal
  const vDotN = dot(ball.vx, ball.vy, nnx, nny);
  if (vDotN < 0) {
    ball.vx -= (1 + restitution) * vDotN * nnx;
    ball.vy -= (1 + restitution) * vDotN * nny;
  }

  return true;
}

// ─── Bumper collision ─────────────────────────────────────────────────────────

/**
 * Resolves a ball–bumper collision.
 * Applies a boost (BUMPER_RESTITUTION > 1) and returns true on hit.
 */
export function resolveBumperCollision(ball: Ball, bumper: Bumper): boolean {
  const dx = ball.x - bumper.x;
  const dy = ball.y - bumper.y;
  const dist = len(dx, dy);
  const minDist = ball.radius + bumper.radius;

  if (dist === 0 || dist >= minDist) return false;

  const invDist = 1 / dist;
  const nx = dx * invDist;
  const ny = dy * invDist;

  // Push ball out
  ball.x += nx * (minDist - dist);
  ball.y += ny * (minDist - dist);

  // Reflect and boost
  const vDotN = dot(ball.vx, ball.vy, nx, ny);
  ball.vx -= (1 + BUMPER_RESTITUTION) * vDotN * nx;
  ball.vy -= (1 + BUMPER_RESTITUTION) * vDotN * ny;

  return true;
}

// ─── Target collision ─────────────────────────────────────────────────────────

/**
 * Resolves a ball–target collision (only when target is not in cooldown).
 * Returns true on hit.
 */
export function resolveTargetCollision(ball: Ball, target: Target): boolean {
  if (target.hit) return false;

  const dx = ball.x - target.x;
  const dy = ball.y - target.y;
  const dist = len(dx, dy);
  const minDist = ball.radius + target.radius;

  if (dist === 0 || dist >= minDist) return false;

  const invDist = 1 / dist;
  const nx = dx * invDist;
  const ny = dy * invDist;

  ball.x += nx * (minDist - dist);
  ball.y += ny * (minDist - dist);

  const vDotN = dot(ball.vx, ball.vy, nx, ny);
  if (vDotN < 0) {
    ball.vx -= (1 + WALL_RESTITUTION) * vDotN * nx;
    ball.vy -= (1 + WALL_RESTITUTION) * vDotN * ny;
  }

  return true;
}

// ─── Flipper collision ────────────────────────────────────────────────────────

/**
 * Resolves a ball–flipper collision, including the flipper surface velocity
 * so that an active (moving) flipper kicks the ball upward.
 *
 * Angular velocity sign convention (canvas y-down):
 *   positive ω → clockwise rotation → angle increases
 *
 * Surface velocity at contact point Q relative to pivot P:
 *   v_surf = ω × (Q - P)  →  (ω * -ry,  ω * rx)
 *   where (rx, ry) = Q - P
 */
export function resolveFlipperCollision(ball: Ball, flipper: Flipper): boolean {
  const tipX = flipper.pivotX + flipper.length * Math.cos(flipper.angle);
  const tipY = flipper.pivotY + flipper.length * Math.sin(flipper.angle);

  const { qx, qy } = closestOnSegment(
    flipper.pivotX, flipper.pivotY,
    tipX, tipY,
    ball.x, ball.y,
  );

  const nx = ball.x - qx;
  const ny = ball.y - qy;
  const dist = len(nx, ny);
  const minDist = ball.radius + FLIPPER_THICKNESS / 2;

  if (dist === 0 || dist >= minDist) return false;

  const invDist = 1 / dist;
  const nnx = nx * invDist;
  const nny = ny * invDist;

  // Push ball out of flipper
  const penetration = minDist - dist;
  ball.x += nnx * penetration;
  ball.y += nny * penetration;

  // Surface velocity at contact point due to flipper rotation
  const rx = qx - flipper.pivotX;
  const ry = qy - flipper.pivotY;
  const svx = flipper.angularVel * (-ry);
  const svy = flipper.angularVel * rx;

  // Ball velocity relative to flipper surface
  const relVx = ball.vx - svx;
  const relVy = ball.vy - svy;

  const relVdotN = dot(relVx, relVy, nnx, nny);
  if (relVdotN < 0) {
    const restitution = 0.72;
    const impulse = -(1 + restitution) * relVdotN;
    ball.vx += impulse * nnx;
    ball.vy += impulse * nny;
  }

  return true;
}

// ─── Flipper update ───────────────────────────────────────────────────────────

/**
 * Advances the flipper angle toward its target (active or rest) and
 * updates angularVel which is used by the collision resolver.
 */
export function updateFlipper(flipper: Flipper): void {
  const target = flipper.active ? flipper.activeAngle : flipper.restAngle;
  const diff = target - flipper.angle;

  if (Math.abs(diff) < 0.005) {
    flipper.angle = target;
    flipper.angularVel = 0;
    return;
  }

  const speed = flipper.active ? FLIPPER_ANGULAR_SPEED : FLIPPER_RETURN_SPEED;
  const step = Math.sign(diff) * Math.min(speed, Math.abs(diff));
  flipper.angularVel = step;
  flipper.angle += step;
}

// ─── Ball physics step ────────────────────────────────────────────────────────

/**
 * Applies gravity and friction, moves ball, clamps to maxSpeed.
 */
export function stepBall(ball: Ball, gravity: number, maxSpeed: number): void {
  ball.vy += gravity;

  ball.vx *= BALL_FRICTION;
  ball.vy *= BALL_FRICTION;

  // Speed cap
  const speed = len(ball.vx, ball.vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Update trail
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 10) ball.trail.shift();
}
