# Antigravity UI Merge, Design Spec

**Date:** 2026-07-03
**Status:** Approved in conversation, pending written review
**Branch:** ui-overhaul

## Overview

Replace the shell of WFH Movement with the redesigned frontend Mike built in Antigravity, now stored at `Frontendexampleantigravity/`. The app keeps its working logic: reminders, streaks, XP, quests, insights, and PWA install. The Antigravity example contributes the look, the layout, a 28-quest content library with step-by-step coaching sequences, and 14 animated SVG movement figures. Its own JavaScript logic is mock and gets discarded.

## Decisions Made

1. Adopt the Antigravity look whole: Inter font, cool palette, sidebar workspace, tight corners.
2. Team and Calendar ship as styled coming-soon panels, not mock features.
3. Rewards ships real, wired to the existing level system.
4. The layout adapts responsively: sidebar becomes a bottom tab bar on phones, right rail stacks into the page.
5. Approach: adopt the Antigravity HTML/CSS as the new shell and rewire the real logic into it (not a restyle of the old HTML).
6. Scope is phased. Phase 1 is this spec. Phase 2 gets its own spec later.
7. The 28-quest library in the example becomes the app's real exercise data, with per-quest XP and durations replacing the tier system.
8. The 14 animated SVG archetypes replace the static files in `illustrations/`.

## Scope

### Phase 1 (this spec)

The full Antigravity visual shell, every existing feature rewired into it, the quest library and animated assets ported, the Rewards tab built against real levels, a profile name setting, and responsive plus PWA restoration.

### Phase 2 (separate spec, not now)

Body stiffness scan, coach insights panel, combo meter, movement restrictions (seated-only, quiet-only), daily goal, quest search. Their UI elements stay out of the DOM until their logic exists.

## Architecture

### Files after the merge

| File | Change |
|------|--------|
| `index.html` | Replaced by the Antigravity structure, adapted: manifest link, service worker registration, theme color, Phase 2 elements removed |
| `style.css` | Replaced by the Antigravity stylesheet plus new responsive rules and the SVG animation classes |
| `app.js` | Kept as entry point; DOM-binding layer rewritten for the new element IDs; logic imports unchanged |
| `exercises.js` | Content replaced by the 28-quest library (schema below) |
| `game.js` | Gains a level-gated unlocks table for Rewards; XP award switches from tier-based to per-quest values |
| `quests.js`, `storage.js`, `reminder.js`, `insights.js`, `timer.js`, `rotation.js`, `service-worker.js` | Unchanged, except the service worker cache version bump |
| `illustrations/` | Deleted; replaced by inline animated SVG archetypes |
| `Frontendexampleantigravity/` | Reference during the build, deleted in the final cleanup commit |

The Antigravity `app.js` is not merged. It exists only as a reference for markup injection patterns and the content library, which this spec ports.

## Screens

**Today.** Greeting uses the time-of-day lines plus the profile name. The sitting card and subtitle read `getSittingMinutes()`. The primary quest card shows the rotation engine's suggestion; Reroll swaps it, Start Quest launches the break. The "why this reset helps" box shows the quest's description. The daily quests grid renders `getTodaysQuests()` with live progress.

**Quests.** The exercise library browser. Filter pills: All, Mobility, Stretch, Strength, Quiet, matching the quest categories. Each card shows name, category, difficulty, duration, XP, and a start button.

**Calendar and Team.** Dimmed sidebar entries opening a coming-soon panel with one line on what is planned. No mock stats, no fake activity.

**Rewards.** Level circle and title from `getProgress()`. The unlocks grid shows four quest packs, one per category, with level requirements: Mobility at level 1, Stretch at level 2, Strength at level 4, Quiet at level 6. Locked packs show their requirement and quest count; unlocked packs list their quests. The gate is presentational: locked quests still work everywhere else. No exercise is ever withheld.

**Progress.** Four stat cards: total breaks, minutes moved, current streak, week adherence from `getWeekStats()`. The body-coverage SVG highlights zones from `getAreaBalance()` using the five zones below.

**Settings.** Profile name, work hours, reminder mode (interval or fixed, restored from the live app), notification style, and reset. Movement restrictions wait for Phase 2.

**Right rail.** The live quest widget is the break timer: circular countdown, the quest's animated step figure, step title and description, step dots, pause and skip. Steps advance on their own durations. Below the widget: the XP bar and the streak shield card bound to real state. The combo meter waits for Phase 2. On phones an active break expands to a full-screen focus view.

**Top bar.** Real streak badge and audio mute (mute persists to settings). "Calendar Synced" and search are removed until their features exist.

**Onboarding wizard.** Antigravity slide style, content swapped to what drives the app: name, work hours, reminder cadence, the "why movement gaps matter" education slide. Body scan, movement preference, and daily goal slides wait for Phase 2.

## Quest Library Port

### Schema

```javascript
{
  id: "posture-reset",
  name: "Posture Reset",
  category: "mobility",        // mobility | stretch | strength | quiet
  difficulty: "Easy",          // Easy | Medium | Hard
  xp: 80,                      // awarded on completion
  duration: 4,                 // minutes, drives the timer
  targetArea: "shoulders",     // neck | shoulders | core | wrists | legs
  desc: "Neck + shoulder release to offset desk stiffness.",
  steps: [                     // per-step coaching, timing, and figure
    { title, desc, duration, animation, svg }
  ]
}
```

`category`, `difficulty`, `xp`, `duration`, `desc`, and `steps` come from the Antigravity library as authored. `targetArea` is added during the port so the rotation engine and the body-coverage map keep working. The five zones match the Progress body map: neck, shoulders, core, wrists, legs.

### Target area assignments (review these)

| Quest | Area | | Quest | Area |
|---|---|---|---|---|
| Posture Reset | shoulders | | Standing Side Bends | core |
| Wrist Stretch | wrists | | Standing Hip Flexor Stretch | legs |
| Spine Twist | core | | Dynamic Hamstring Sweeps | legs |
| Calf Raises | legs | | Sit-to-Stand Squats | legs |
| Seated Plank | core | | Standing Calf Raises | legs |
| Eye Focus Flow | neck | | Air Squats | legs |
| Desk Shoulder Rolls | shoulders | | Seated Leg Extensions | legs |
| Deep Belly Breath | core | | Desk Push-Ups | shoulders |
| Seated Spinal Twists | core | | Brisk Stair Climbing | legs |
| Seated Figure-4 Stretch | legs | | The Desk Plank | core |
| Chin Tucks | neck | | Marching in Place | legs |
| Wrist Extensor Stretch | wrists | | Rebounding Bounces | legs |
| Seated Glute Squeezes | legs | | Pacing Phone Call | legs |
| Scapular Retractions | shoulders | | | |
| Doorway Chest Stretch | shoulders | | | |

Legs carries the most quests because sitting is a lower-body problem. Legacy history entries recorded under the old taxonomy map on read: spine becomes core, hips becomes legs.

### XP and duration

`awardBreak` in game.js takes the quest's `xp` value instead of computing from tier. The leveling curve is untouched. The two-option break length (2 or 5 minutes) retires; each quest runs its own duration, stepped through its `steps` array.

## Exercise Assets

The 14 animated SVG archetypes (shoulders, neck, wrist, twist, legs, squats, pushups, march, sidebend, eyes, calf, lunge, rebound, lungs) move from the example into the app as the exercise figures. Each quest step names its archetype and animation class, so one archetype serves many quests. Steps without a figure fall back to the shoulders archetype. The animation CSS ships in the new stylesheet. The 32 static files in `illustrations/` are deleted.

## Data and Migration

The localStorage schema gains two settings keys: `userName` and `muted`. Nothing else changes shape. Existing users keep streak, XP, quests, and history because the reading code is untouched. Returning users skip onboarding via the existing first-visit flag. A missing `userName` produces the nameless greeting until Settings supplies one. Unlocks derive from level at render time and need no storage.

Completed-break history may reference retired exercise ids; stats count them fine because counts and durations do not join against exercise definitions. Area balance maps legacy area names as noted above.

## Failure Handling

Notification permission denied falls back to the on-screen countdown in the Today view, as the live app does now. Reminder engine, snooze, and shield logic carry over unchanged. The service worker cache version bumps so installed PWAs cannot serve stale HTML against the new CSS. Reset keeps its existing full-wipe behavior, restarting onboarding.

## Testing

Existing tests in `tests/` must pass unmodified; they prove the merge left logic behavior alone, except the two deliberate changes (per-quest XP, unlocks), which get their own tests: XP award uses the quest value, pack boundaries unlock at exact levels, area mapping handles legacy names.

Manual verification before merge to main, on a local preview: fresh onboarding end to end, a full break from reminder through logged XP, reroll, quest library filters, settings round-trip including rename and mute, reset, Rewards at level boundaries, and the phone layout at 375px including the full-screen break view.

## Rollout

Work happens on `ui-overhaul`. The in-flight cleanup commits as a checkpoint first. Netlify serves `main` until Mike approves the preview, then the branch merges. Rollback is deleting or reverting the branch. A feature inventory (snooze, shield, notification fallback, interval and fixed reminders, reset, install) is confirmed against the new UI in the implementation plan before code changes.
