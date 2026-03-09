/**
 * StartScreen — shown before the game begins.
 * Lets the player choose a difficulty and see the high score.
 */

'use client';

import { motion } from 'framer-motion';
import type { Difficulty } from '@/types/game';

interface Props {
  highScore: number;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onStart: () => void;
}

const DIFFICULTIES: Array<{ key: Difficulty; label: string; description: string; color: string }> = [
  { key: 'easy',   label: 'EASY',   description: '5 lives · slow gravity · wide flippers', color: '#00ff88' },
  { key: 'medium', label: 'MEDIUM', description: '3 lives · normal gravity · standard',     color: '#ffcc00' },
  { key: 'hard',   label: 'HARD',   description: '2 lives · fast gravity · short flippers', color: '#ff3366' },
];

export default function StartScreen({ highScore, selectedDifficulty, onSelectDifficulty, onStart }: Props) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none"
      style={{ background: 'rgba(4, 0, 16, 0.92)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Title */}
      <motion.h1
        className="text-5xl font-bold tracking-widest mb-1 font-mono"
        style={{ color: '#ff00ff', textShadow: '0 0 20px #ff00ff, 0 0 40px #aa00aa' }}
        animate={{ textShadow: ['0 0 20px #ff00ff', '0 0 35px #ff00ff', '0 0 20px #ff00ff'] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        NEON
      </motion.h1>
      <motion.h1
        className="text-5xl font-bold tracking-widest mb-6 font-mono"
        style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff, 0 0 40px #0088aa' }}
      >
        PINBALL
      </motion.h1>

      {/* High score */}
      {highScore > 0 && (
        <motion.div
          className="mb-6 text-center font-mono"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs tracking-widest" style={{ color: '#7766aa' }}>BEST SCORE</p>
          <p className="text-2xl font-bold" style={{ color: '#aa66ff', textShadow: '0 0 10px #aa44ff' }}>
            {highScore.toLocaleString()}
          </p>
        </motion.div>
      )}

      {/* Difficulty selection */}
      <div className="mb-6 flex flex-col gap-2 w-60">
        {DIFFICULTIES.map(({ key, label, description, color }) => (
          <motion.button
            key={key}
            onClick={() => onSelectDifficulty(key)}
            className="px-4 py-2 rounded font-mono text-left transition-all border"
            style={{
              borderColor: selectedDifficulty === key ? color : '#333366',
              background: selectedDifficulty === key ? color + '22' : 'transparent',
              color: selectedDifficulty === key ? color : '#556688',
              boxShadow: selectedDifficulty === key ? `0 0 10px ${color}55` : 'none',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="font-bold text-sm">{label}</span>
            <span className="block text-xs opacity-70 mt-0.5">{description}</span>
          </motion.button>
        ))}
      </div>

      {/* Start button */}
      <motion.button
        onClick={onStart}
        className="px-10 py-3 rounded-lg font-bold font-mono text-lg tracking-widest"
        style={{
          background: 'linear-gradient(135deg, #7700ff, #ff00aa)',
          color: '#ffffff',
          boxShadow: '0 0 20px #7700ff88, 0 0 40px #ff00aa44',
        }}
        whileHover={{ scale: 1.06, boxShadow: '0 0 30px #7700ffaa, 0 0 50px #ff00aa66' }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        INSERT COIN
      </motion.button>

      {/* Controls hint */}
      <motion.div
        className="mt-6 text-center font-mono text-xs"
        style={{ color: '#445566' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>Z / ← — LEFT FLIPPER &nbsp;|&nbsp; X / → — RIGHT FLIPPER</p>
        <p className="mt-1">SPACE — LAUNCH BALL &nbsp;|&nbsp; P — PAUSE</p>
      </motion.div>
    </motion.div>
  );
}
