/**
 * EndScreen — shown when the player loses all lives.
 * Displays final score, high score, and restart option.
 */

'use client';

import { motion } from 'framer-motion';
import type { Difficulty } from '@/types/game';

interface Props {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  difficulty: Difficulty;
  onRestart: () => void;
  onMenu: () => void;
}

export default function EndScreen({ score, highScore, isNewHighScore, onRestart, onMenu }: Props) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none"
      style={{ background: 'rgba(4, 0, 16, 0.93)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* GAME OVER text */}
      <motion.h2
        className="text-4xl font-bold font-mono tracking-widest mb-2"
        style={{ color: '#ff3355', textShadow: '0 0 20px #ff0033' }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      >
        GAME OVER
      </motion.h2>

      {/* New high score banner */}
      {isNewHighScore && (
        <motion.div
          className="mb-3 px-4 py-1 rounded font-mono text-sm font-bold tracking-widest"
          style={{
            background: 'linear-gradient(90deg, #ffcc00, #ff6600)',
            color: '#000',
            boxShadow: '0 0 15px #ffcc0088',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          ★ NEW HIGH SCORE ★
        </motion.div>
      )}

      {/* Scores */}
      <motion.div
        className="mb-8 text-center font-mono"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs tracking-widest mb-1" style={{ color: '#556688' }}>SCORE</p>
        <p
          className="text-4xl font-bold mb-4"
          style={{ color: '#00ffff', textShadow: '0 0 12px #00ffff88' }}
        >
          {score.toLocaleString()}
        </p>
        <p className="text-xs tracking-widest mb-1" style={{ color: '#556688' }}>BEST</p>
        <p className="text-xl font-bold" style={{ color: '#aa66ff' }}>
          {highScore.toLocaleString()}
        </p>
      </motion.div>

      {/* Buttons */}
      <div className="flex gap-4">
        <motion.button
          onClick={onRestart}
          className="px-8 py-3 rounded-lg font-bold font-mono tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #7700ff, #ff00aa)',
            color: '#fff',
            boxShadow: '0 0 15px #7700ff88',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          PLAY AGAIN
        </motion.button>

        <motion.button
          onClick={onMenu}
          className="px-6 py-3 rounded-lg font-bold font-mono tracking-widest border"
          style={{ borderColor: '#334466', color: '#6688aa' }}
          whileHover={{ scale: 1.05, borderColor: '#7700ff', color: '#aa88ff' }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          MENU
        </motion.button>
      </div>
    </motion.div>
  );
}
