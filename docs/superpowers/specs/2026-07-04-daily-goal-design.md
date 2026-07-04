# Daily Goal — Design

**Date:** 2026-07-04
**Feature:** Phase 2, first pickup. A standing daily movement target with an always-visible progress ring on the Today view.

## Summary

Give the single-player experience a personal daily target: N movement breaks per
day (default 4, adjustable). A progress ring on the Today view fills as breaks
accrue. Reaching the goal fires a warm celebration and a small one-time XP bonus.
The goal counts every day, workday or not.

This is distinct from the rotating "Take 3 movement breaks" daily quest: the quest
changes with the day's seed, the goal is the user's own standing target that never
rotates.

## Decisions (settled with Mike)

- **Unit:** breaks per day. Reuses `completedBreaks[]`, no new tracking.
- **Value:** adjustable, default 4, range 1–10.
- **Rest days:** counts every day. No workday gating.
- **On reaching goal:** celebrate + small one-time bonus XP (+15).
- **Celebration copy:** `Goal met. {goal} breaks today. Your body thanks you.`
  ({goal} is the live target number.)

## Data & state

- **New setting** `dailyGoal` added to `DEFAULT_SETTINGS` in `storage.js`, default `4`.
- **Progress source:** `getTodayRecord().completedBreaks.length`. Resets daily for
  free because the today record is date-keyed.
- **Once-per-day guard:** a `goalAwarded` boolean on the today record, mirroring the
  existing `questsDone` guard in `awardNewQuestCompletions`. Resets daily with the
  record.

## Award flow

New function `awardDailyGoal()` in `app.js`, called from `completeQuest` immediately
after `awardNewQuestCompletions()` (after line 407). It mirrors the quest-award
pattern exactly:

```
// Pure predicate (unit-tested directly)
export function shouldAwardGoal(record, goal) {
  return !record.goalAwarded && (record.completedBreaks || []).length >= goal;
}

// Thin side-effecting wrapper in app.js
function awardDailyGoal() {
  const goal = getSettings().dailyGoal;
  const record = getTodayRecord();
  if (!shouldAwardGoal(record, goal)) return;
  const r = awardQuestBonus(15);
  showXpToast(`Goal met. ${goal} breaks today. Your body thanks you.`
    + (r.leveledUp ? ` · Level ${r.level}!` : ''));
  record.goalAwarded = true;
  saveState({ ...(getState() || {}), today: record });
}
```

Each award function re-reads `getTodayRecord()` and re-saves `today`, so calling
this right after `awardNewQuestCompletions()` does not clobber the just-saved
`questsDone` (it reads the persisted record, adds `goalAwarded`, saves again).

## UI

### Goal ring

Fills the empty right slot of the existing `sitting-status-card`. The card already
has a `sitting-status-left` with no matching right, so the layout was scaffolded for
this.

- SVG progress ring styled like the live-timer ring (`timer-progress-circle`),
  reusing the same stroke-dashoffset technique.
- Center text: `2 / 4`. Label beneath: `breaks today`.
- Ring updates on every Today render (`renderToday`) and after each completed break.
- At 100%: subtle glow / filled state (CSS class toggled).

### Settings

A stepper "Daily movement goal" in the settings view, mirroring the existing
interval-minutes control (label + minus/plus buttons + value, clamped 1–10). Saved
through the existing settings save path, so it flows into `saveSettings` and
`DEFAULT_SETTINGS` merge with no special handling.

## Testing

One `node` assert test (`tests/daily-goal.test.js`, plain assert like the existing
tests): the goal-award decision fires exactly at the threshold. Given a record with
`goal - 1` breaks → no award; at `goal` breaks and `!goalAwarded` → award; at `goal`
breaks with `goalAwarded` already set → no second award. To keep the awardable logic
testable, factor the "should award?" decision into a pure predicate the test can call
directly (e.g. `shouldAwardGoal(record, goal)`), with `awardDailyGoal` as the thin
side-effecting wrapper.

## Flagged follow-up (out of scope)

The +15 goal bonus adds to a level curve the handoff (`docs/HANDOFF.md`) already
flags as too fast (max level in a few weeks). The bonus is kept deliberately small.
Rebalancing the `LEVELS` thresholds in `game.js` is a separate task, not part of this
feature.
