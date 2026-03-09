/**
 * Procedural audio engine using the Web Audio API.
 *
 * All sounds are synthesised in-browser — no external files needed.
 * AudioContext is created lazily on first user interaction to satisfy
 * browser autoplay policies.
 *
 * Usage:
 *   const audio = createAudioEngine();
 *   audio.enable();   // call after user gesture
 *   audio.playBumper();
 */

export interface AudioEngine {
  enable: () => void;
  disable: () => void;
  toggle: () => boolean;
  isEnabled: () => boolean;
  playBumper: (intensity?: number) => void;
  playFlipper: () => void;
  playSlingshot: () => void;
  playTarget: () => void;
  playDrain: () => void;
  playLaunch: (charge: number) => void;
  playLevelUp: () => void;
  setMusicEnabled: (on: boolean) => void;
  isMusicEnabled: () => boolean;
}

export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let enabled = true;
  let musicEnabled = true;
  let musicGain: GainNode | null = null;

  function getCtx(): AudioContext | null {
    if (!enabled) return null;
    if (!ctx) {
      try {
        ctx = new AudioContext();
        startMusic();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Short envelope: attack + decay */
  function playEnvelope(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    detune = 0,
    freqEnd?: number,
  ): void {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
    }
    osc.detune.setValueAtTime(detune, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  /** White-noise burst */
  function playNoise(duration: number, volume: number): void {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const bufLen = Math.ceil(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const source = c.createBufferSource();
    source.buffer = buffer;

    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(gain);
    gain.connect(c.destination);
    source.start(now);
  }

  // ─── Chiptune background music ────────────────────────────────────────────

  const MELODY = [
    523, 587, 659, 698, 784, 880, 784, 698,
    659, 587, 523, 494, 523, 587, 659, 523,
  ];
  let melodyStep = 0;
  let melodyTimeout: ReturnType<typeof setTimeout> | null = null;

  function scheduleNextNote(): void {
    if (!musicEnabled || !enabled) return;
    const c = getCtx();
    if (!c) return;

    const freq = MELODY[melodyStep % MELODY.length];
    melodyStep++;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(musicGain!);

    osc.type = 'square';
    osc.frequency.value = freq * 0.5; // sub-octave
    const now = c.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.3);

    melodyTimeout = setTimeout(scheduleNextNote, 320);
  }

  function startMusic(): void {
    const c = getCtx();
    if (!c || musicGain) return;
    musicGain = c.createGain();
    musicGain.gain.value = musicEnabled ? 0.2 : 0;
    musicGain.connect(c.destination);
    scheduleNextNote();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    enable() {
      enabled = true;
      getCtx(); // initialise and start music
    },
    disable() {
      enabled = false;
      if (melodyTimeout) clearTimeout(melodyTimeout);
      if (musicGain) musicGain.gain.value = 0;
    },
    toggle() {
      if (enabled) this.disable();
      else this.enable();
      return enabled;
    },
    isEnabled: () => enabled,

    setMusicEnabled(on: boolean) {
      musicEnabled = on;
      if (musicGain) musicGain.gain.value = on ? 0.2 : 0;
      if (on && enabled) {
        if (!melodyTimeout) scheduleNextNote();
      }
    },
    isMusicEnabled: () => musicEnabled,

    playBumper(intensity = 1) {
      // High-pitched "ping"
      playEnvelope(800 + intensity * 200, 'sine', 0.15, 0.3);
      playEnvelope(400, 'square', 0.08, 0.15);
    },

    playFlipper() {
      // Mechanical click
      playNoise(0.06, 0.15);
      playEnvelope(120, 'square', 0.05, 0.2);
    },

    playSlingshot() {
      playEnvelope(600, 'sawtooth', 0.12, 0.25, 0, 300);
      playNoise(0.05, 0.2);
    },

    playTarget() {
      playEnvelope(1050, 'sine', 0.18, 0.28);
      playEnvelope(1400, 'sine', 0.09, 0.15);
    },

    playDrain() {
      playEnvelope(350, 'sawtooth', 0.6, 0.3, 0, 80);
      playEnvelope(200, 'sine', 0.8, 0.25, 0, 60);
    },

    playLaunch(charge: number) {
      const top = 200 + charge * 600;
      playEnvelope(80, 'sawtooth', 0.25, 0.35, 0, top);
    },

    playLevelUp() {
      // Ascending arpeggio
      const c = getCtx();
      if (!c) return;
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => playEnvelope(freq, 'sine', 0.2, 0.3), i * 80);
      });
    },
  };
}
