# 🕹️ Neon Pinball

A full-stack browser pinball game with neon cyberpunk aesthetics, built with **Next.js 15**, **TypeScript** (strict mode), **Tailwind CSS**, and **HTML5 Canvas**.

---

## ✨ Features

- **Physics engine** — gravity, friction, ball–wall, ball–bumper, and ball–flipper collisions with surface-velocity contribution for realistic flipper kicks
- **3 difficulty levels** — Easy (5 lives, wide flippers), Medium (3 lives, standard), Hard (2 lives, fast gravity)
- **Neon visual theme** — glowing bumpers, neon flippers, metallic ball with motion trail, dark grid background
- **Scoring system** — combo multiplier up to ×8, score flash animations, level progression every 5 000 pts
- **High score** — persisted to `localStorage` across sessions
- **Procedural audio** — synthesised via Web Audio API (no external files): bumper pings, flipper clicks, drain sweep, launch whoosh, level-up arpeggio, background chiptune melody
- **Sound & music toggles** — on-screen controls in the HUD
- **Pause / resume** — `P` or `Esc` key, or the HUD pause button
- **Fully responsive & mobile-first** — canvas scales to any viewport; on-screen touch controls for mobile
- **Animated screens** — Framer Motion transitions for start, pause overlay, and game-over screens
- **Custom SVG favicon** — pinball-themed, matches the neon aesthetic
- **Deploy-ready for Vercel** — zero configuration required

---

## 🎮 Controls

### Desktop
| Action | Keys |
|--------|------|
| Left flipper | `Z`, `←`, or `Shift Left` |
| Right flipper | `X`, `→`, or `Shift Right` |
| Launch ball (hold to charge) | `Space` |
| Pause / resume | `P` or `Esc` |

### Mobile
- **LEFT FLIP** button — left flipper
- **RIGHT FLIP** button — right flipper
- **LAUNCH** button — hold to charge, release to fire

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Rendering | HTML5 Canvas 2D |
| Audio | Web Audio API (procedural) |
| State | React `useRef` + `useState` |
| Persistence | `localStorage` |
| Deploy | Vercel |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── globals.css        # Neon theme, overflow/body resets
│   ├── layout.tsx         # Root layout with metadata & viewport
│   └── page.tsx           # Single-page entry → <PinballGame />
├── components/
│   ├── PinballGame.tsx    # Root game component (canvas + overlay)
│   ├── HUD.tsx            # Score, lives, level, multiplier strip
│   ├── StartScreen.tsx    # Main menu with difficulty picker
│   ├── EndScreen.tsx      # Game-over with score summary
│   └── MobileControls.tsx # Touch flipper + launch buttons
├── hooks/
│   ├── usePinball.ts      # Game loop, physics, input, rendering
│   └── useHighScore.ts    # localStorage high score hook
├── lib/
│   ├── constants.ts       # All magic numbers & colour palette
│   ├── physics.ts         # Collision detection & resolution
│   ├── gameState.ts       # State factory & table layout
│   ├── renderer.ts        # Canvas draw functions
│   └── audio.ts           # Web Audio synthesiser
└── types/
    └── game.ts            # All TypeScript interfaces
```

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd pinball

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000
```

Requirements: **Node.js 18+**

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI
```bash
npx vercel
```

### Option B — GitHub integration
1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — no configuration needed

The project is fully static and uses no server-side APIs.

---

## 🎯 Gameplay Tips

- **Hold Space / LAUNCH longer** to charge a faster shot — full charge sends the ball all the way to the top
- Chain bumper hits quickly for a **combo multiplier** (up to ×8)
- Hit the three small **target circles** at the top for big bonus points
- **Slingshots** (angled walls left/right) give extra bounce and score
- Each 5 000 points advances you to a new **level** — gravity gradually increases
