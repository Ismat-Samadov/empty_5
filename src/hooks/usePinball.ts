/**
 * usePinball — core game hook.
 *
 * Manages the full game loop: physics, collisions, scoring, level progression,
 * input handling (keyboard + touch), and canvas rendering.
 *
 * Game state is kept in a ref (no re-renders per frame).
 * A lightweight UISnapshot is synced to React state each frame for the HUD.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AudioEngine } from '@/lib/audio';
import { createAudioEngine } from '@/lib/audio';
import {
  BUMPER_LIT_FRAMES,
  COMBO_TIMEOUT_FRAMES,
  GAME_HEIGHT,
  GAME_WIDTH,
  LAUNCH_CHARGE_RATE,
  LAUNCH_SPEED_MAX,
  LAUNCH_SPEED_MIN,
  LEVEL_SCORE_THRESHOLD,
  MAX_MULTIPLIER,
  SLINGSHOT_LIT_FRAMES,
  TARGET_RESET_FRAMES,
} from '@/lib/constants';
import { createInitialState, resetBallForLaunch } from '@/lib/gameState';
import {
  resolveBumperCollision,
  resolveFlipperCollision,
  resolveTargetCollision,
  resolveWallCollision,
  stepBall,
  updateFlipper,
} from '@/lib/physics';
import { addScoreFlash, drawFrame } from '@/lib/renderer';
import type { Difficulty, InternalGameState, UISnapshot } from '@/types/game';

// ─── Helper: derive UI snapshot from internal state ───────────────────────────

function toSnapshot(s: InternalGameState): UISnapshot {
  return {
    status: s.status,
    score: s.score,
    lives: s.lives,
    level: s.level,
    multiplier: s.multiplier,
    highScore: s.highScore,
    combo: s.combo,
    launchCharge: s.launchCharge,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePinball(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  // Initial difficulty selection shown on start screen
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  // UI snapshot updated each frame
  const [snapshot, setSnapshot] = useState<UISnapshot>({
    status: 'start',
    score: 0,
    lives: 3,
    level: 1,
    multiplier: 1,
    highScore: 0,
    combo: 0,
    launchCharge: 0,
  });

  // Internal game state (mutated without triggering renders)
  const stateRef = useRef<InternalGameState | null>(null);

  // Animation frame handle
  const rafRef = useRef<number>(0);

  // Audio engine (singleton)
  const audioRef = useRef<AudioEngine>(createAudioEngine());

  // Input tracking refs (updated by event listeners, read each frame)
  const keysRef = useRef({
    leftFlipper: false,
    rightFlipper: false,
    launch: false,
    pause: false,
  });

  // ── High-score from localStorage ──────────────────────────────────────────
  const highScoreRef = useRef(0);
  useEffect(() => {
    try {
      const s = localStorage.getItem('neon-pinball-highscore');
      if (s) {
        highScoreRef.current = parseInt(s, 10);
        setSnapshot(prev => ({ ...prev, highScore: highScoreRef.current }));
      }
    } catch { /* ignore */ }
  }, []);

  function saveHighScore(score: number): void {
    const next = Math.max(highScoreRef.current, score);
    highScoreRef.current = next;
    try { localStorage.setItem('neon-pinball-highscore', String(next)); } catch { /* ignore */ }
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;

    const { status } = state;

    // ── Handle launch phase ────────────────────────────────────────────────
    if (status === 'launching') {
      // Update flippers even during launch (cosmetic)
      state.flippers.forEach(updateFlipper);

      if (keysRef.current.launch) {
        state.launchHeld = true;
        state.launchCharge = Math.min(1, state.launchCharge + LAUNCH_CHARGE_RATE);
      } else if (state.launchHeld) {
        // Key was released — fire the ball
        const speed = LAUNCH_SPEED_MIN + (LAUNCH_SPEED_MAX - LAUNCH_SPEED_MIN) * state.launchCharge;
        state.ball.vx = (Math.random() - 0.5) * 2; // slight horizontal randomness
        state.ball.vy = -speed;
        state.launchCharge = 0;
        state.launchHeld = false;
        state.status = 'playing';
        audioRef.current.playLaunch(state.launchCharge);
      }

      drawFrame(canvas, state);
      setSnapshot(toSnapshot(state));
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (status === 'paused' || status === 'gameover' || status === 'start') {
      drawFrame(canvas, state);
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // ── status === 'playing' ──────────────────────────────────────────────

    // 1. Read flipper input
    const leftActive = keysRef.current.leftFlipper;
    const rightActive = keysRef.current.rightFlipper;

    if (leftActive !== state.flippers[0].active) {
      state.flippers[0].active = leftActive;
      if (leftActive) audioRef.current.playFlipper();
    }
    if (rightActive !== state.flippers[1].active) {
      state.flippers[1].active = rightActive;
      if (rightActive) audioRef.current.playFlipper();
    }

    // 2. Update flipper angles
    state.flippers.forEach(updateFlipper);

    // 3. Step ball physics
    stepBall(state.ball, state.gravity, state.maxSpeed);

    // 4. Resolve collisions (3 passes for stability)
    for (let pass = 0; pass < 3; pass++) {
      // Walls
      state.walls.forEach(wall => {
        const hit = resolveWallCollision(state.ball, wall);
        if (hit && wall.isSlingshot) {
          if (!wall.lit) {
            state.score += state.multiplier * 50; // base slingshot points
            wall.lit = true;
            wall.litTimer = SLINGSHOT_LIT_FRAMES;
            audioRef.current.playSlingshot();
            addScoreFlash(state.ball.x, state.ball.y, `${state.multiplier * 50}`);
          }
        }
      });

      // Bumpers
      state.bumpers.forEach(bumper => {
        const hit = resolveBumperCollision(state.ball, bumper);
        if (hit && !bumper.lit) {
          const pts = bumper.points * state.multiplier;
          state.score += pts;
          bumper.lit = true;
          bumper.litTimer = BUMPER_LIT_FRAMES;
          state.combo++;
          state.comboTimer = COMBO_TIMEOUT_FRAMES;
          state.multiplier = Math.min(MAX_MULTIPLIER, 1 + Math.floor(state.combo / 3));
          audioRef.current.playBumper(state.multiplier / MAX_MULTIPLIER);
          addScoreFlash(bumper.x, bumper.y - bumper.radius - 8, `+${pts}`);
        }
      });

      // Targets
      state.targets.forEach(target => {
        const hit = resolveTargetCollision(state.ball, target);
        if (hit) {
          const pts = target.points * state.multiplier;
          state.score += pts;
          target.hit = true;
          target.hitTimer = TARGET_RESET_FRAMES;
          state.combo++;
          state.comboTimer = COMBO_TIMEOUT_FRAMES;
          state.multiplier = Math.min(MAX_MULTIPLIER, 1 + Math.floor(state.combo / 3));
          audioRef.current.playTarget();
          addScoreFlash(target.x, target.y - target.radius - 8, `+${pts}`);
        }
      });

      // Flippers
      state.flippers.forEach(flipper => resolveFlipperCollision(state.ball, flipper));
    }

    // 5. Decrement timers
    state.bumpers.forEach(b => {
      if (b.lit && --b.litTimer <= 0) b.lit = false;
    });
    state.walls.forEach(w => {
      if (w.lit && w.litTimer !== undefined && --w.litTimer <= 0) w.lit = false;
    });
    state.targets.forEach(t => {
      if (t.hit && --t.hitTimer <= 0) { t.hit = false; }
    });

    // 6. Combo timeout
    if (state.comboTimer > 0) {
      if (--state.comboTimer === 0) {
        state.combo = 0;
        state.multiplier = 1;
      }
    }

    // 7. Level up
    const newLevel = 1 + Math.floor(state.score / LEVEL_SCORE_THRESHOLD);
    if (newLevel > state.level) {
      state.level = newLevel;
      // Bump gravity slightly each level (capped)
      state.gravity = Math.min(state.gravity + 0.02, state.gravity * 1.05);
      audioRef.current.playLevelUp();
    }

    // 8. High score tracking
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }

    // 9. Check drain
    if (state.ball.y > GAME_HEIGHT + 40) {
      state.lives--;
      audioRef.current.playDrain();
      saveHighScore(state.score);

      if (state.lives <= 0) {
        state.status = 'gameover';
      } else {
        resetBallForLaunch(state);
      }
    }

    // 10. Draw
    drawFrame(canvas, state);

    // 11. Sync UI
    setSnapshot(toSnapshot(state));

    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef]);

  // ── Start / restart game ──────────────────────────────────────────────────

  const startGame = useCallback((difficulty: Difficulty) => {
    // Initialise audio on first user gesture
    audioRef.current.enable();

    // Cancel any existing loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const hs = highScoreRef.current;
    stateRef.current = createInitialState(difficulty, hs);
    setSnapshot(toSnapshot(stateRef.current));

    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pauseGame = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.status === 'playing') {
      s.status = 'paused';
    } else if (s.status === 'paused') {
      s.status = 'playing';
      // Re-queue loop
      rafRef.current = requestAnimationFrame(loop);
    }
    setSnapshot(toSnapshot(s));
  }, [loop]);

  // ── Keyboard input ────────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyZ':
        case 'ShiftLeft':
          keysRef.current.leftFlipper = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyX':
        case 'ShiftRight':
          keysRef.current.rightFlipper = true;
          e.preventDefault();
          break;
        case 'Space':
          keysRef.current.launch = true;
          e.preventDefault();
          break;
        case 'KeyP':
        case 'Escape':
          pauseGame();
          break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyZ':
        case 'ShiftLeft':
          keysRef.current.leftFlipper = false;
          break;
        case 'ArrowRight':
        case 'KeyX':
        case 'ShiftRight':
          keysRef.current.rightFlipper = false;
          break;
        case 'Space':
          keysRef.current.launch = false;
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [pauseGame]);

  // ── Mobile touch controls (exposed to MobileControls component) ───────────

  const setLeftFlipper = useCallback((active: boolean) => {
    keysRef.current.leftFlipper = active;
  }, []);

  const setRightFlipper = useCallback((active: boolean) => {
    keysRef.current.rightFlipper = active;
  }, []);

  const setLaunch = useCallback((active: boolean) => {
    keysRef.current.launch = active;
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Canvas scaling ────────────────────────────────────────────────────────

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Reserve ~60px for mobile controls at bottom
      const availH = vh - 60;
      const scale = Math.min(vw / GAME_WIDTH, availH / GAME_HEIGHT);
      canvas.style.width = `${Math.floor(GAME_WIDTH * scale)}px`;
      canvas.style.height = `${Math.floor(GAME_HEIGHT * scale)}px`;
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef]);

  return {
    snapshot,
    selectedDifficulty,
    setSelectedDifficulty,
    startGame,
    pauseGame,
    setLeftFlipper,
    setRightFlipper,
    setLaunch,
    audio: audioRef.current,
  };
}
