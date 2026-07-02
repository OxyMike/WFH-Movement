# WFH Movement — Gamification Core Loop Spec

Date: 2026-07-02
Scope: Phase 1 of gamification. Single-player, no backend, pure static site. Phases 2 (Mystery Break Box) and 3 (classes/skills) are designed-for but explicitly not built.

## Goal

Turn the break loop into a game loop built on choice autonomy: every prompt offers three effort tiers, one tap launches the timer, completion pays XP toward levels with titles, and all copy reframes movement as a productivity "Focus Buff."

## Psychology Requirements (binding on copy and UX)

- Choice autonomy: the user always picks the effort level; the app never commands.
- Zero friction: one tap from prompt (in-app or notification) to a running timer. No intermediate screens.
- No punishment mechanics anywhere: no XP decay, no caps, no guilt copy, no red "you failed" states.
- Declining is a first-class choice: "Snooze 15 min" appears with the tiers, styled neutrally.
- No em dashes in copy; warm conversational voice per the existing design system.

## Tiers

Every exercise gains a `tier` field: `easy` | `medium` | `hard`.

- **Easy (1 min, +10 XP):** gentle stretches. Existing neck, wrist, and seated exercises.
- **Medium (2 min, +20 XP):** active mobility. Wall angels, glute bridges, dead bug, cat-cow, hip work.
- **Hard (3 min, +35 XP):** heart-rate movers. Eight NEW exercises in the existing PT-credible style (description + 3 cues each): bodyweight squats, desk pushups, jumping jacks, high knees, alternating lunges, wall sit, stair climbs, mountain climbers.

All 24 existing exercises get tagged easy or medium (exact assignment happens in the plan; gentle static stretches = easy, active/loaded movement = medium). Library grows to 32.

Rotation: `suggestExercise` gains a tier filter. It keeps the no-repeat-target-area preference, applied within the chosen tier; fallback chain still never returns undefined.

Timer durations are fixed per tier (60 s / 120 s / 180 s). The old quick/full duration picker is removed.

## The Choice Card (replaces the break prompt exercise card)

When a nudge fires or the user taps "Take a break now", the dashboard shows:

- Heading: "Focus Buff available"
- Subline: "2 minutes of movement raises blood flow to your brain. Sharper thinking for the next hour."
- Three big tier buttons: "🌱 Easy · 1 min · +10 XP", "🚶 Medium · 2 min · +20 XP", "🔥 Hard · 3 min · +35 XP"
- Under the Easy button, when the streak is 1+: "keeps your N-day streak alive"
- A neutral text link: "Snooze 15 min" — dismisses the prompt and schedules the next reminder 15 minutes out. No guilt styling or copy.

Tapping a tier immediately picks a matching-tier exercise and launches the timer. Exercise name and rotating cues display on the timer screen itself; there is no reading step between tap and timer. "Show me a different one" moves onto the timer screen (swaps exercise within the same tier, timer restarts).

## Notifications

- Chrome/Android (Notification actions supported): the nudge notification is titled "Focus Buff available" and carries three action buttons (Easy/Medium/Hard). Tapping an action opens/focuses the app and launches the timer for that tier directly.
- Safari/iOS and other browsers without action support: notification body "Pick your energy"; tapping opens the app at the choice card.
- Service worker passes the chosen tier to the page (message or URL param) so the page can launch the timer without user re-input.

## XP, Levels, Titles

- XP per completed break by tier: 10 / 20 / 35. Completion means the timer ran to zero; skip pays nothing (and says nothing about it).
- Ten levels with cumulative XP thresholds: 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200.
- Titles by level 1-10: Chair Dweller, Posture Apprentice, Stretch Scout, Swivel Chair Escapee, Circulation Knight, Momentum Wrangler, Standing Desk Nomad, Focus Buff Alchemist, Kinetic Virtuoso, Desk Escapist.
- Dashboard shows current level, title, and an XP progress bar to the next level, next to the existing streak/breaks stats.

## The Reward Moment

The completion flash becomes a reward card (same 1.5 s minimum, extends to ~2.5 s on level-up):

- "+20 XP" with a count-up animation and "Focus Buff applied"
- XP bar filling toward next level
- On level-up: "Level 4 unlocked: Swivel Chair Escapee" with the existing completion tones plus one extra higher tone

## Architecture

- New `game.js` module owns: TIER_XP map, LEVELS thresholds/titles array, `awardBreak(tier)` (returns `{ xpGained, totalXp, level, leveledUp, title }`), `getProgress()` (level, title, xp into level, xp needed), buff copy strings.
- `exercises.js`: adds `tier` field to all, appends 8 hard exercises. (Amends the previously frozen module; this is the deliberate exception.)
- `rotation.js`: `suggestExercise(lastTargetArea, excludeId, tier)` — tier param filters first.
- `storage.js`: game state (`{ xp: 0 }`) stored under a `game` key inside the existing `wfh-movement` localStorage object; absent key defaults to zero XP (no migration needed). Level is always derived from XP, never stored.
- `app.js` + `index.html`: choice card markup, snooze wiring, reward card, dashboard level display, notification action routing.
- `reminder.js`: gains a `snooze(minutes)` capability (or app.js schedules a one-off 15-minute timeout that calls triggerBreak; whichever the plan finds cleaner without breaking the frozen reminder engine's tests).
- `service-worker.js`: notification actions array + tier routing in notificationclick; cache bump to `wfh-movement-v5`.
- Timer.js stays frozen.

## Testing

- Unit tests for game.js: XP award per tier, level boundaries (exactly at threshold, one below), title lookup, progress math.
- Unit tests for rotation tier filter: returns only requested tier, area-avoidance within tier, fallback when tier+area over-constrains.
- Exercises tests updated: every exercise has a valid tier; hard tier has 8 entries; total 32.
- Existing tests must keep passing (timer, storage core, reminder).
- Manual pass: nudge → choice card → each tier launches correct-duration timer → reward card → dashboard XP/level updates → snooze delays 15 min → notification actions on Chrome.

## Explicitly Deferred

- Phase 2: Mystery Break Box (variable rewards) — will live in game.js.
- Phase 3: Classes (Ergonomic Mage, Coffee Barbarian) and skill unlocks — levels/XP from this phase carry over.
- Leaderboards/social (scrapped v2, decisions archived in memory).
- Avatars, desk pets, cosmetics.
