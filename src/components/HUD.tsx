/**
 * HUD (Heads-Up Display) — overlaid on top of the game canvas.
 * Shows score, lives, level, multiplier, and combo.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { UISnapshot } from '@/types/game';

interface Props {
  snapshot: UISnapshot;
  onPause: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

/** Filled heart / empty heart for lives */
function Lives({ count, max }: { count: number; max: number }) {
  const hearts = Array.from({ length: max }, (_, i) => i < count);
  return (
    <div className="flex gap-0.5">
      {hearts.map((filled, i) => (
        <motion.span
          key={i}
          className="text-lg leading-none"
          animate={filled ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {filled ? '❤️' : '🖤'}
        </motion.span>
      ))}
    </div>
  );
}

export default function HUD({ snapshot, onPause, soundEnabled, musicEnabled, onToggleSound, onToggleMusic }: Props) {
  const { score, lives, level, multiplier, highScore, combo } = snapshot;

  // Max lives depends on difficulty — we cap display at 5
  const maxLives = Math.min(lives + 0, 5); // show actual lives remaining

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none select-none font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        {/* Score */}
        <div>
          <p className="text-xs tracking-widest" style={{ color: '#445566' }}>SCORE</p>
          <motion.p
            key={score}
            className="text-xl font-bold leading-tight"
            style={{ color: '#00ffff', textShadow: '0 0 8px #00ffff88' }}
            animate={{ scale: [1.15, 1] }}
            transition={{ duration: 0.15 }}
          >
            {score.toLocaleString()}
          </motion.p>
        </div>

        {/* Center: Level + controls */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <div
            className="px-2 py-0.5 rounded text-xs font-bold tracking-widest"
            style={{ background: '#110033', color: '#aa66ff', border: '1px solid #7700ff55' }}
          >
            LVL {level}
          </div>
          <div className="flex gap-1">
            {/* Pause */}
            <button
              onClick={onPause}
              className="w-6 h-6 rounded text-xs flex items-center justify-center"
              style={{ background: '#111133', color: '#7766aa', border: '1px solid #334466' }}
            >
              ⏸
            </button>
            {/* Sound toggle */}
            <button
              onClick={onToggleSound}
              className="w-6 h-6 rounded text-xs flex items-center justify-center"
              style={{ background: '#111133', color: soundEnabled ? '#00ffcc' : '#334455', border: '1px solid #334466' }}
            >
              🔊
            </button>
            {/* Music toggle */}
            <button
              onClick={onToggleMusic}
              className="w-6 h-6 rounded text-xs flex items-center justify-center"
              style={{ background: '#111133', color: musicEnabled ? '#ff88ff' : '#334455', border: '1px solid #334466' }}
            >
              🎵
            </button>
          </div>
        </div>

        {/* High score + lives */}
        <div className="text-right">
          <p className="text-xs tracking-widest" style={{ color: '#445566' }}>BEST</p>
          <p className="text-sm font-bold" style={{ color: '#aa66ff' }}>
            {highScore.toLocaleString()}
          </p>
          <div className="mt-1 flex justify-end">
            {Array.from({ length: Math.max(lives, 0) }).map((_, i) => (
              <span key={i} className="text-sm leading-none">❤️</span>
            ))}
          </div>
        </div>
      </div>

      {/* Multiplier & combo strip */}
      <AnimatePresence>
        {multiplier > 1 && (
          <motion.div
            key={multiplier}
            className="flex items-center justify-center gap-3 pb-1"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span
              className="text-xs font-bold px-2 py-0.5 rounded tracking-widest"
              style={{
                background: '#ff660022',
                color: '#ff8800',
                border: '1px solid #ff660044',
                textShadow: '0 0 6px #ff660088',
              }}
            >
              x{multiplier} MULTIPLIER
            </span>
            {combo >= 2 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded tracking-widest"
                style={{ color: '#ffff44', textShadow: '0 0 6px #ffff0088' }}
              >
                {combo} COMBO
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
