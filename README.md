# DeskHero 🦸

**Level up your health, one small quest at a time.**

DeskHero is a free, calm, gamified wellness prototype for people who spend long
hours sitting — software professionals, students, remote workers, and
freelancers. It turns tiny bursts of movement, hydration, posture care, eye
rest, and focused work into a friendly game of achievable quests.

This repository is **Phase 1: a fully clickable product prototype**. It uses
mock data and browser storage only — no accounts, no APIs, no cloud, no
payments.

> DeskHero provides general wellness guidance and is not medical advice. Stop
> exercising if you experience pain, dizziness, chest discomfort, or unusual
> shortness of breath.

---

## Product overview

The experience is built around small, non-judgemental wins:

- **Welcome + demo** — jump straight in with a sample profile via *Explore Demo*.
- **Onboarding** — a 7-step, progress-tracked flow that builds a personalised
  plan with simple rule-based logic (activity level, goal, time budget,
  preferences, reminders).
- **Home dashboard** — greeting, level & XP, daily health score, streak, weekly
  rhythm, today's quests, and a "Start next quest" button.
- **Quest details** — instructions, a countdown timer for timed quests, an
  easier alternative, safety guidance, and one-tap completion.
- **Guided workout** — step-by-step routines with timers or rep counts,
  previous/next navigation, easier variations, and quit/complete controls.
- **Quest library** — filter by duration, category, difficulty, standing/seated,
  and no-equipment.
- **Progress** — level, total XP, a weekly completion chart, and lifetime stats.
  Never focuses on body weight or appearance.
- **Achievements** — unlockable badges with progress and locked/unlocked states.
- **Work Mode** — 25 / 45 / 60-minute focus sessions with a movement-break
  prompt that awards XP.
- **Profile & settings** — edit preferences, sound + reduced-motion toggles, a
  weekly streak freeze, privacy note, and *Reset Demo*.

### Design principles

Encouraging, beginner-friendly, calm, modern, lightweight, and non-judgemental.
The app never shames a missed workout or a broken streak — it uses a **weekly
consistency score** instead of punishing missed days.

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a custom, semantic design-token theme
- **shadcn-style UI components** (hand-built, no Radix dependency)
- **Lucide** icons
- **Framer Motion** for subtle animations (respects reduced motion)
- **Recharts** for the weekly progress chart
- **localStorage** for persistence

Everything is free and open-source. No AWS / GCP / Azure / Firebase / Supabase,
no API keys, no payment info.

> Note: the app uses a system font stack (no Google Fonts fetch), so it builds
> and runs fully offline after `npm install`.

---

## Installation

Requires **Node.js 18.18+** (or 20+).

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

To create and run an optimised production build:

```bash
npm run build
npm run start
```

## Available scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the local development server       |
| `npm run build` | Create an optimised production build     |
| `npm run start` | Serve the production build               |
| `npm run lint`  | Run ESLint (Next.js core-web-vitals)     |

---

## Folder structure

```
deskhero/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout, providers, celebration overlay
│  │  ├─ globals.css             # Design tokens + base styles
│  │  ├─ page.tsx                # 1. Welcome screen
│  │  ├─ onboarding/page.tsx     # 2. Multi-step onboarding
│  │  └─ (app)/                  # Authenticated shell (sidebar + bottom nav)
│  │     ├─ layout.tsx           # Nav shell + onboarding guard
│  │     ├─ dashboard/page.tsx   # 3. Home dashboard
│  │     ├─ quests/page.tsx      # 6. Quest library
│  │     ├─ quests/[id]/page.tsx # 4. Quest details
│  │     ├─ workout/page.tsx     # 5. Guided workout
│  │     ├─ progress/page.tsx    # 7. Progress
│  │     ├─ achievements/page.tsx# 8. Achievements
│  │     ├─ work-mode/page.tsx   # 9. Work Mode
│  │     └─ profile/page.tsx     # 10. Profile & settings
│  ├─ components/
│  │  ├─ ui/                     # Button, Card, Progress, Badge, Switch
│  │  ├─ nav/                    # Sidebar, bottom nav, nav config
│  │  └─ app/                    # Logo, icons, score ring, stat tile, quest card, celebration
│  ├─ hooks/
│  │  └─ use-timer.ts            # Pause/resume countdown timer
│  └─ lib/
│     ├─ types.ts                # Domain types
│     ├─ data.ts                 # Quest catalog, achievements, levels, seed data
│     ├─ logic.ts                # Leveling, personalisation, scoring, achievements
│     ├─ store.tsx               # localStorage-backed React context + actions
│     └─ utils.ts                # cn(), time/date helpers
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

---

## Gamification & personalisation

**XP model**: hydration/eye break 5 XP, posture/2-min movement 10 XP, 5-min
mobility 20 XP, 10-min walk 25 XP, 15-min workout 40 XP, and a 50 XP bonus for
completing all daily quests. XP for a given quest is awarded **only once per
day** (repeat completions are prevented).

**Levels**: Desk Survivor → Movement Rookie → Posture Protector → Mobility
Warrior → Strength Builder → Energy Master → Desk Hero.

**Personalisation** (rule-based, see `lib/logic.ts`): fewer, shorter quests for
mostly-inactive users; goal-driven prioritisation (e.g. *posture* surfaces chest
stretches, shoulder mobility, neck relaxation; *strength* surfaces chair squats,
wall push-ups, glute bridges, bird dogs, elevated planks; *sleep* surfaces
evening walking + breathing + wind-down); and quests are never longer than the
user's selected time budget.

---

## Accessibility

- Full keyboard navigation with a visible focus ring and a skip-to-content link
- Semantic roles/labels (`role="switch"`, `role="progressbar"`, `aria-pressed`,
  `aria-current`, live regions for completions)
- Large, touch-friendly targets and generous spacing
- Reduced-motion support via an OS media query **and** an in-app toggle
- Information is never conveyed by colour alone (icons + text labels throughout)

---

## Prototype limitations

- **Local only** — all state lives in `localStorage` under `deskhero.state.v1`.
  Clearing site data or using a different browser starts fresh. Use *Reset Demo*
  in Profile to clear intentionally.
- **No real authentication** — there are no accounts; the "profile" is local.
- **Reminders are illustrative** — the reminder preference is captured but the
  prototype does not schedule OS/push notifications.
- **Timers are session-based** — they don't run in the background or persist if
  the tab is closed mid-session.
- **Work Mode includes a "Skip to break (demo)"** control so testers don't need
  to wait a full 25–60 minutes during validation.
- **Data is mock/seed** — history, stats, and streaks in demo mode are sample
  data for realistic-looking screens.

---

## Suggested Phase 2 recommendations

- Real accounts and sync (with a privacy-first, opt-in backend)
- Actual scheduled reminders / push notifications and calendar integration
- Optional wearable + step-count integrations (Apple Health, Google Fit)
- Smarter, adaptive plans that learn from completion patterns over time
- Social/among-friends encouragement (opt-in, non-competitive by default)
- Richer original illustrations and an animated mascot
- Localisation and expanded accessibility auditing (screen-reader test passes)
- Offline-first PWA install with background timers
- A larger, professionally reviewed exercise library with video demonstrations

---

Built as a Phase 1 validation prototype — suitable for testing with 10–20
software professionals. Every primary button works, no dead routes, no console
errors. Have fun, and remember: **every movement counts.**
