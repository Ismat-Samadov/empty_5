/**
 * Persists the high score in localStorage.
 */

import { useCallback, useEffect, useState } from 'react';

const LS_KEY = 'neon-pinball-highscore';

export function useHighScore() {
  const [highScore, setHighScoreState] = useState(0);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setHighScoreState(parseInt(stored, 10));
    } catch {
      /* localStorage unavailable (SSR / private mode) */
    }
  }, []);

  const submitScore = useCallback((score: number) => {
    setHighScoreState(prev => {
      const next = Math.max(prev, score);
      try {
        localStorage.setItem(LS_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { highScore, submitScore };
}
