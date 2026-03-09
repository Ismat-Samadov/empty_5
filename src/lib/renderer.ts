/**
 * Canvas renderer for Neon Pinball.
 *
 * Everything is drawn using the 2D canvas API with neon glow effects
 * achieved via ctx.shadowBlur / ctx.shadowColor.
 *
 * Call drawFrame(canvas, state) once per animation frame.
 */

import type { Ball, Bumper, Flipper, InternalGameState, Target, Wall } from '@/types/game';
import {
  COLOR_BG,
  COLOR_BALL,
  COLOR_BALL_GLOW,
  COLOR_FLIPPER,
  COLOR_FLIPPER_GLOW,
  COLOR_TABLE_BORDER,
  COLOR_TRAIL,
  FLIPPER_THICKNESS,
  GAME_HEIGHT,
  GAME_WIDTH,
} from './constants';

// ─── Glow helpers ─────────────────────────────────────────────────────────────

function setGlow(ctx: CanvasRenderingContext2D, color: string, blur: number): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0;
}

// ─── Background & table ───────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#040010');
  grad.addColorStop(1, '#0a0028');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawTableBorder(ctx: CanvasRenderingContext2D): void {
  setGlow(ctx, COLOR_TABLE_BORDER, 15);
  ctx.strokeStyle = COLOR_TABLE_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);
  clearGlow(ctx);
}

// ─── Walls ────────────────────────────────────────────────────────────────────

function drawWalls(ctx: CanvasRenderingContext2D, walls: Wall[]): void {
  walls.forEach(wall => {
    const isSling = !!wall.isSlingshot;
    const isLit = isSling && !!wall.lit;

    if (isSling) {
      const color = isLit ? '#ffffff' : '#ff6600';
      const glow = isLit ? '#ffffff' : '#ff3300';
      setGlow(ctx, glow, isLit ? 25 : 10);
      ctx.strokeStyle = color;
      ctx.lineWidth = isLit ? 5 : 3;
    } else {
      setGlow(ctx, '#5500cc', 8);
      ctx.strokeStyle = '#5500cc';
      ctx.lineWidth = 2;
    }

    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.stroke();
    clearGlow(ctx);
  });
}

// ─── Bumpers ──────────────────────────────────────────────────────────────────

function drawBumpers(ctx: CanvasRenderingContext2D, bumpers: Bumper[]): void {
  bumpers.forEach(b => {
    const isLit = b.lit;
    const glowBlur = isLit ? 30 : 12;
    const alpha = isLit ? 1 : 0.85;

    // Outer glow ring
    setGlow(ctx, b.glowColor, glowBlur);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = isLit ? '#ffffff' : b.color;
    ctx.lineWidth = isLit ? 4 : 2.5;
    ctx.stroke();

    // Fill
    const rg = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0, b.x, b.y, b.radius);
    rg.addColorStop(0, isLit ? '#ffffff' : b.glowColor);
    rg.addColorStop(1, b.color + (isLit ? 'ff' : 'aa'));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.globalAlpha = 1;

    clearGlow(ctx);
  });
}

// ─── Targets ──────────────────────────────────────────────────────────────────

function drawTargets(ctx: CanvasRenderingContext2D, targets: Target[]): void {
  targets.forEach(t => {
    if (t.hit) {
      // Show as dim while in cooldown
      ctx.globalAlpha = 0.25;
    }

    setGlow(ctx, t.color, t.hit ? 0 : 12);
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fillStyle = t.hit ? '#333355' : t.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.stroke();
    clearGlow(ctx);

    if (t.hit) ctx.globalAlpha = 1;
  });
}

// ─── Ball ─────────────────────────────────────────────────────────────────────

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  const { x, y, radius, trail } = ball;

  // Trail
  trail.forEach((pt, i) => {
    const progress = (i + 1) / trail.length;
    ctx.globalAlpha = progress * 0.35;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius * progress * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_TRAIL;
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Glow
  setGlow(ctx, COLOR_BALL_GLOW, 18);

  // Metallic gradient sphere
  const rg = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, radius * 0.05, x, y, radius);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(0.3, '#c0c0ff');
  rg.addColorStop(0.7, '#6060cc');
  rg.addColorStop(1, '#1a1a44');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = rg;
  ctx.fill();

  clearGlow(ctx);
}

// ─── Flippers ─────────────────────────────────────────────────────────────────

function drawFlipper(ctx: CanvasRenderingContext2D, flipper: Flipper): void {
  const { pivotX, pivotY, angle, length, active } = flipper;

  const tipX = pivotX + length * Math.cos(angle);
  const tipY = pivotY + length * Math.sin(angle);

  const halfThick = FLIPPER_THICKNESS / 2;

  // Perpendicular unit vector to the flipper direction
  const dx = tipX - pivotX;
  const dy = tipY - pivotY;
  const invLen = 1 / Math.sqrt(dx * dx + dy * dy);
  const px = -dy * invLen * halfThick;
  const py = dx * invLen * halfThick;

  const glowColor = active ? '#ffffff' : COLOR_FLIPPER_GLOW;
  const fillColor = active ? '#88ffff' : COLOR_FLIPPER;
  setGlow(ctx, glowColor, active ? 22 : 12);

  // Draw rounded capsule shape as a filled path
  ctx.beginPath();
  // Pivot circle
  ctx.arc(pivotX, pivotY, halfThick, angle + Math.PI / 2, angle - Math.PI / 2);
  // Tip circle
  ctx.arc(tipX, tipY, halfThick * 0.6, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.closePath();

  const grad = ctx.createLinearGradient(pivotX, pivotY, tipX, tipY);
  grad.addColorStop(0, fillColor);
  grad.addColorStop(1, fillColor + '88');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = active ? '#ffffff' : '#00ccee';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Pivot dot
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff88';
  ctx.fill();

  clearGlow(ctx);
}

// ─── Score pop (flash text on bumper/target hit) ──────────────────────────────

const scoreFlashes: Array<{ x: number; y: number; text: string; life: number }> = [];

export function addScoreFlash(x: number, y: number, text: string): void {
  scoreFlashes.push({ x, y, text, life: 45 });
}

function drawScoreFlashes(ctx: CanvasRenderingContext2D): void {
  for (let i = scoreFlashes.length - 1; i >= 0; i--) {
    const f = scoreFlashes[i];
    const progress = f.life / 45;
    ctx.globalAlpha = progress;
    ctx.fillStyle = '#ffff00';
    ctx.font = `bold ${Math.round(12 + (1 - progress) * 4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - (1 - progress) * 20);
    f.life--;
    if (f.life <= 0) scoreFlashes.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ─── Decorative grid ──────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#8800ff';
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_WIDTH; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < GAME_HEIGHT; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Launch charge indicator ──────────────────────────────────────────────────

function drawLaunchIndicator(ctx: CanvasRenderingContext2D, charge: number): void {
  if (charge <= 0) return;
  const barH = 80;
  const barW = 8;
  const bx = GAME_WIDTH / 2 - barW / 2;
  const by = BALL_SPAWN_Y - barH;

  ctx.fillStyle = '#11113a';
  ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);

  const filledH = Math.round(barH * charge);
  const color = charge < 0.5 ? '#00ff88' : charge < 0.8 ? '#ffcc00' : '#ff3300';
  setGlow(ctx, color, 10);
  ctx.fillStyle = color;
  ctx.fillRect(bx, by + barH - filledH, barW, filledH);
  clearGlow(ctx);
}

// Helper used by launch indicator
const BALL_SPAWN_Y = 560;

// ─── Pause overlay ────────────────────────────────────────────────────────────

function drawPauseOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(4, 0, 16, 0.75)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  setGlow(ctx, '#7700ff', 20);
  ctx.fillStyle = '#aa44ff';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#8866cc';
  ctx.fillText('Press P to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25);
  ctx.textAlign = 'left';
  clearGlow(ctx);
}

// ─── Main draw call ───────────────────────────────────────────────────────────

export function drawFrame(
  canvas: HTMLCanvasElement,
  state: InternalGameState,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawBackground(ctx);
  drawGrid(ctx);
  drawTableBorder(ctx);
  drawWalls(ctx, state.walls);
  drawBumpers(ctx, state.bumpers);
  drawTargets(ctx, state.targets);

  // Draw flippers
  state.flippers.forEach(f => drawFlipper(ctx, f));

  // Launch charge bar (shown before launch)
  if (state.status === 'launching') {
    drawLaunchIndicator(ctx, state.launchCharge);
  }

  drawBall(ctx, state.ball);
  drawScoreFlashes(ctx);

  if (state.status === 'paused') {
    drawPauseOverlay(ctx);
  }
}
