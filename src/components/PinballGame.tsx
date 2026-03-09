/**
 * PinballGame — root game component.
 *
 * Assembles the canvas, HUD overlay, start/end screens, and mobile controls.
 * All game logic is delegated to the usePinball hook.
 */

'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

import EndScreen from './EndScreen';
import HUD from './HUD';
import MobileControls from './MobileControls';
import StartScreen from './StartScreen';
import { GAME_HEIGHT, GAME_WIDTH } from '@/lib/constants';
import { usePinball } from '@/hooks/usePinball';
import type { Difficulty } from '@/types/game';

export default function PinballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    snapshot,
    selectedDifficulty,
    setSelectedDifficulty,
    startGame,
    pauseGame,
    setLeftFlipper,
    setRightFlipper,
    setLaunch,
    audio,
  } = usePinball(canvasRef);

  const { status, score, highScore, lives } = snapshot;

  // Track whether sound/music are enabled for the HUD toggle buttons
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const handleToggleSound = useCallback(() => {
    const nowEnabled = audio.toggle();
    setSoundEnabled(nowEnabled);
  }, [audio]);

  const handleToggleMusic = useCallback(() => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    audio.setMusicEnabled(next);
  }, [audio, musicEnabled]);

  const handleStart = useCallback(() => {
    startGame(selectedDifficulty);
  }, [startGame, selectedDifficulty]);

  const handleRestart = useCallback(() => {
    startGame(selectedDifficulty);
  }, [startGame, selectedDifficulty]);

  const handleMenu = useCallback(() => {
    // We show the start screen when status is 'start'
    // Easiest approach: just reload or trigger a state that shows start screen
    // For simplicity, we start the game in 'start' status by calling startGame
    // with a special flag — but usePinball always starts in 'launching'.
    // Instead we track a separate "show start" flag:
    setShowStart(true);
  }, []);

  const [showStart, setShowStart] = useState(true);

  const handleStartFromMenu = useCallback(() => {
    setShowStart(false);
    startGame(selectedDifficulty);
  }, [startGame, selectedDifficulty]);

  const isGameOver = status === 'gameover';
  const isLaunching = status === 'launching';
  const isNewHigh = score > 0 && score >= highScore;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ background: '#040010' }}
    >
      {/* Game area wrapper */}
      <div
        className="relative flex-shrink-0"
        style={{ width: 'fit-content' }}
      >
        {/* Canvas (logical 360×700, CSS-scaled to fit viewport) */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="block"
          style={{ imageRendering: 'pixelated', display: 'block' }}
        />

        {/* HUD overlay — only during active gameplay */}
        {!showStart && !isGameOver && (
          <HUD
            snapshot={snapshot}
            onPause={pauseGame}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
          />
        )}

        {/* Start screen */}
        <AnimatePresence>
          {showStart && (
            <StartScreen
              key="start"
              highScore={highScore}
              selectedDifficulty={selectedDifficulty}
              onSelectDifficulty={(d: Difficulty) => setSelectedDifficulty(d)}
              onStart={handleStartFromMenu}
            />
          )}
        </AnimatePresence>

        {/* Game over screen */}
        <AnimatePresence>
          {isGameOver && !showStart && (
            <EndScreen
              key="end"
              score={score}
              highScore={highScore}
              isNewHighScore={isNewHigh}
              difficulty={selectedDifficulty}
              onRestart={handleRestart}
              onMenu={handleMenu}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile controls (below the canvas) */}
      {!showStart && !isGameOver && (
        <div className="w-full" style={{ maxWidth: `${GAME_WIDTH}px` }}>
          <MobileControls
            onLeftDown={() => setLeftFlipper(true)}
            onLeftUp={() => setLeftFlipper(false)}
            onRightDown={() => setRightFlipper(true)}
            onRightUp={() => setRightFlipper(false)}
            onLaunchDown={() => setLaunch(true)}
            onLaunchUp={() => setLaunch(false)}
            launchCharge={snapshot.launchCharge}
            isLaunching={isLaunching}
          />
        </div>
      )}
    </div>
  );
}
