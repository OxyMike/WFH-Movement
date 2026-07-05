# Stiffness Scan — Design

**Date:** 2026-07-04
**Status:** Approved, ready for planning
**Phase:** 2 (single-player gamification)

## Purpose

On-demand self-report of stiff body zones that (a) recommends a matching quest to
start now, and (b) biases the rest of the day's break suggestions toward those
zones. Turns the app from passive ("here's a random stretch") into responsive
("you said your neck is tight — here's a neck stretch").

Audience is adults 60+, so the interaction is tap-only, no reading required to act.

## Scope

The five body zones already used by quests and insights:
`neck, shoulders, core, wrists, legs`. A scan maps 1:1 onto quest `targetArea`,
so no new taxonomy.

Out of scope: stiffness history, trends, severity levels, the body-map SVG as a
tap target. Just today's zones, plain buttons.

## 1. Data

- New per-day field on the today record: `stiffAreas` — array of zone strings,
  a subset of the five zones.
- Resets daily with the rest of the today record. No history persisted.

## 2. Scan UI

- Button on the Today view: **"Feeling stiff?"**
- Opens a small panel: five toggle buttons (Neck, Shoulders, Core, Wrists, Legs)
  plus a **Done** button. Tap a zone to highlight/unhighlight it.
- Reuses existing button styles — no new component.
- Reopening the scan pre-selects the current `stiffAreas` so she edits rather
  than restarts.

## 3. Recommend now

- On **Done**: filter exercises to `targetArea ∈ stiffAreas`, drop the
  last-done area if that still leaves a choice, random-pick from the rest.
- Set the result as the primary suggested quest and show its existing card with
  **Start now**. No new screen or flow.
- If no zones were selected, fall back to the normal `suggestExercise` call.

## 4. Bias later breaks

- Extend `suggestExercise(lastTargetArea, excludeId, tier, preferredAreas)` with
  one optional param.
- When `preferredAreas` is non-empty: prefer exercises whose `targetArea` is in
  it, still excluding `lastTargetArea` and `excludeId`. If nothing qualifies,
  fall back to the current behavior (avoid last area, else any).
- When `preferredAreas` is empty or absent: behavior is unchanged, so existing
  callers are unaffected.
- The ~5 call sites (initial suggest, reroll, reminder-fires, resume) pass
  `getTodayRecord().stiffAreas`.

## 5. Testing

Node asserts, no framework, matching `tests/*.test.js`:

- `suggestExercise` prefers a stiff zone when one is supplied.
- `suggestExercise` ignores `preferredAreas` when empty — regression guard for
  existing callers.
- `suggestExercise` falls back when no exercise matches a stiff zone.
- Recommend-now picker returns a quest in a stiff zone.
- Recommend-now picker falls back to a normal suggestion when no zones selected.

## 6. Ship checklist

- Bump service worker cache **v9 → v10** (installed PWA users get stale JS
  otherwise).
- Add any new file to the SW precache list. (Current plan reuses existing files,
  so likely none — verify at ship.)
