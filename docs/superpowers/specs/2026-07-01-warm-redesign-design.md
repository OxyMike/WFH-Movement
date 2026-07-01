# WFH Movement — Warm Redesign Spec

Date: 2026-07-01
Scope: Full visual and copy redesign of the site. All JS logic modules stay untouched except element-ID updates and a service worker cache bump.

## Goal

Transform WFH Movement from a functional-but-generic tool into a warm, human companion. Personality target: friendly, approachable, encouraging — Headspace/Duolingo warmth, never nagging, no guilt language, no em dashes.

## What Does Not Change

- `storage.js`, `timer.js`, `reminder.js`, `rotation.js`, `exercises.js` — logic frozen
- `service-worker.js` — only the cache name bumps (`wfh-movement-v4`)
- Tests, localStorage schema (`wfh-movement` key), PWA manifest structure, Netlify config
- `app.js` changes only where element IDs or view flow require it

## Design Language

- **Palette (CSS custom properties in `:root`, one theme file):**
  - Background: warm cream `#faf6f0`; cards white with soft diffuse shadows, no hard borders
  - Primary action: existing teal family, warmed slightly
  - Accent/energy: warm coral (for the primary "take a break" action)
  - Panel tints: soft sage, peach, cream variants replacing the current green/amber/red/purple panels
- **Shape:** 16–20px card radii, pill buttons, gentle hover lift on buttons
- **Type:** Google Fonts — rounded display face (Nunito or Quicksand) for headings, clean body face. Loaded via one `<link>`; font choice lives in `--font-heading`/`--font-body` variables so it is a two-line swap later. Service worker caches the font for offline.
- **Copy voice:** conversational and encouraging. Examples of register: "Time to unfold", "Nice work", "Next nudge in 45 min". Never guilt, never clinical.

## Landing Page (first visit)

Replaces the current drop-straight-into-form onboarding. Sections top to bottom:

1. **Hero:** app name, warm one-liner promise ("Your body wasn't built to sit all day. Two minutes an hour fixes more than you think."), one big CTA button.
2. **Why it matters strip:** the hour-by-hour sitting-damage hook condensed to one scannable line per effect (circulation, metabolism, fat-burning enzyme, insulin, spinal compression). The long-term damage detail (cardio/metabolic/musculoskeletal/vascular panels) collapses behind a "see what long-term sitting does" expander (`<details>` or JS toggle).
3. **How it works row:** three friendly steps — set your hours → get gentle nudges → move for 2 minutes.
4. **Repeat CTA.**

CTA opens setup, restyled as a friendly 3-question conversation (work hours, reminder style, break length) rather than a form stack. Functionally identical fields to today. Returning users (localStorage present) skip landing entirely and go to the dashboard.

## Dashboard

- **Greeting header:** time-of-day aware ("Good morning, let's keep you moving").
- **Next-break card:** countdown reframed as "Next nudge in 45 min" with a gentle visual (arc or progress dot), not a bare timer readout.
- **Stats:** "N breaks today" and "N-day streak" with a small motif (flame/leaf); streak growth celebrated in copy.
- **Primary action:** warm-coral "Take a break now" button.
- **Active exercise card (on break trigger):** designed placeholder art zone — soft tinted panel showing the body-area name and a simple icon until real images are added later (image slot preserved); description; cues rendered as friendly checkmarks; buttons "Quick reset · 90 sec" and "Full break · 5 min"; swap button "Show me a different one".

## Timer Screen

- Circular ring kept; background softens from flat deep teal to a calmer gradient.
- Ring: rounded stroke cap, subtle glow.
- Cues display one at a time, rotating gently, instead of a stacked list.
- Completion: brief "Nice work" celebratory flash with the existing tones, then return to dashboard.

## Educational Content

The current `#section-why` content moves into the landing page (condensed strip + expander as above). Returning users can reach it via a small "Why breaks matter" link in the dashboard footer.

## Error/Edge States

- Notification permission denied: existing on-screen countdown fallback unchanged.
- Placeholder art zone must look intentional, not broken — no empty boxes or missing-image icons.

## Testing

- Existing unit tests must continue to pass unchanged (`node --experimental-vm-modules tests/run.js`).
- Manual verification: first-visit flow (landing → setup → first exercise), returning-user flow (straight to dashboard), full timer cycle, settings modal, hard-refresh cache bust.

## Deferred to v2 (explicitly out of scope)

- Daily leaderboards, teams, leagues, any social features — require a backend; separate project after this ships.
- Real exercise images — Mike adds later into the preserved image slots.
