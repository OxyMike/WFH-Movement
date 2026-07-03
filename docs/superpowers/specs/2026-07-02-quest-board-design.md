# WFH Movement — Quest Board Spec

Date: 2026-07-02
Scope: Daily quests, workday streaks with streak shield, and a Progress/insights page. Single-player, localStorage only, no backend. The product name stays **WFH Movement** everywhere; FlowDesk was a working title in the vision doc and must not appear in any UI copy, code identifiers, or metadata.

## Goal

Turn each workday into a small quest board: 3 achievable daily quests, a streak that respects weekends and forgives one slip, and a progress page that shows the week honestly. Rewards consistency over intensity.

## Binding Principles

- No punishment mechanics: quests expire silently, no red states, no "failed" copy.
- At least one of each day's quests must be completable with a single easy break (minimum viable move).
- Warm design system (cream/teal/coral/Nunito) governs all new UI. No FlowDesk palette, no dashboard restructure.
- No em dashes in copy. Conversational, encouraging voice.
- Honest data framing: the sitting timer is "time since your last break," and the copy must say so plainly.

## Daily Quests

- Pool of 12 templates in `quests.js`. Each: `{ id, title, description, check (function over the day's data), target, bonusXp }`.
- The 12 templates:
  1. "Take 3 movement breaks" — any tier, target 3, +20 XP
  2. "Take 2 movement breaks" — any tier, target 2, +15 XP
  3. "Give your wrists some love" — 1 wrists-area break, +15 XP
  4. "Unknot your neck" — 1 neck-area break, +15 XP
  5. "Wake up your hips" — 1 hips-area break, +15 XP
  6. "Straighten the desk slump" — 1 spine-area break, +15 XP
  7. "Bring the heat" — 1 hard-tier break, +25 XP
  8. "Gentle does it" — 1 easy-tier break, +10 XP
  9. "Break up a long sit" — complete a break after the sitting timer passes 75 minutes, +20 XP
  10. "Mix it up" — breaks in 2 different body areas today, +15 XP
  11. "Early mover" — 1 break before 10:00 AM, +15 XP
  12. "Strong finish" — 1 break after 3:00 PM, +15 XP
- Selection: each workday, a deterministic seed derived from the date string (YYYY-MM-DD) picks 3 distinct templates. Weighting rule: the selection always includes at least one template satisfiable by a single easy break (templates 2, 3, 4, 5, 6, 8, 11, 12 qualify). Same date always yields the same 3 quests (testable).
- Non-workdays generate no quests; the quest strip hides.
- Progress updates live as breaks complete. Completing a quest awards its bonus XP through the existing `awardBreak`-adjacent pipeline (a `awardQuestBonus(xp)` helper in game.js that adds XP and returns level-up info) and shows a small XP toast in the warm style.
- Quest state (selected ids, per-quest progress, completed flags) persists per day in the daily record; a new day regenerates.

## Workday Streaks and Streak Shield

- Settings gains workday toggles (7 checkboxes, default Mon-Fri): stored as `workDays: [1,2,3,4,5]` (JS day indices) in settings with a migration-safe default.
- Streak rules (replaces calendar-day logic in storage.js — the one deliberate unfreeze):
  - Only selected workdays can increment the streak (one increment per day with at least one completed break).
  - Non-workdays are skipped: Friday to Monday is consecutive when Sat/Sun are not workdays.
  - Missing a workday resets the streak to 0 unless a shield is held (below).
- Streak shield:
  - Earned by completing at least one break on 5 consecutive workdays; holding maximum is 1 (no stacking).
  - A missed workday consumes the shield silently: streak survives, shield gone.
  - Dashboard shows a shield chip (🛡️) next to the streak flame while held; after consumption the dashboard shows a one-time gentle note: "your shield covered [weekday]".
  - Shield state (`shield: { held: boolean, earnedProgress: number }`) lives in the game object in storage.
- Existing users: absent fields default (workDays Mon-Fri, no shield, streak preserved as-is).

## Progress Page and Sitting Timer

- New Progress view (`#view-progress`), linked from the dashboard ("See your progress"), back link returns to dashboard.
- Sections, all derived on the fly from stored break history via `insights.js` (no new background tracking):
  - **This week:** total minutes moved (sum of tier durations of completed breaks over the last 7 calendar days), a per-workday bar row of break counts, current streak and best-ever streak (best streak becomes a stored value updated on increment).
  - **Body-area balance:** one chip per area (hips, spine, shoulders, neck, wrists, cardio) with the count of breaks in the last 7 workdays; the most neglected area gets a gentle nudge line, e.g. "your shoulders have been patient this week".
  - **Sitting timer:** minutes since last completed break during work hours. Displayed on the dashboard idle card as "Sitting for N min" (hidden outside work hours and before the first visit of the day, where it shows "Fresh start"). Resets on break completion. Copy must make clear it counts time since the last break.
- Data change: the daily record's completedBreaks entries gain `tier` and `completedAt` (ISO timestamp). Old entries without these fields still count toward totals; they are excluded from time-of-day and minutes calculations gracefully (counted as 0 minutes, no crash).

## Architecture

- Create `quests.js`: template pool, `getTodaysQuests(date, settings)`, `evaluateQuests(dayRecord, quests)` returning per-quest progress/completion, seeded deterministic selection.
- Create `insights.js`: `getWeekStats()`, `getAreaBalance()`, `getSittingMinutes(now, settings)`.
- Modify `storage.js` (deliberate unfreeze): workday-aware `getStreak`, shield earn/consume logic, best-streak tracking, extended logBreak signature `logBreak(exerciseId, targetArea, tier)` (backward compatible — tier optional), completedAt stamping.
- Modify `game.js` minimally: add `awardQuestBonus(xp)` (reuses level math; returns same shape as awardBreak).
- Modify `app.js` + `index.html`: quest strip, shield chip, sitting timer line, Progress view, settings workday toggles, XP toast.
- Frozen: timer.js, reminder.js, rotation.js, exercises.js.
- Service worker: add `/quests.js` and `/insights.js` to ASSETS; cache bump to `wfh-movement-v7` on ship.

## Testing

- quests.js: same date yields same 3 quests; selections always contain one single-easy-break quest; each template's check function against synthetic day records (met/unmet); non-workday yields none.
- storage.js streaks: Friday-to-Monday continuity, missed-workday reset, shield earn at exactly 5 workdays, shield consumption preserves streak, no stacking, defaults for legacy data.
- insights.js: week totals with mixed legacy/new records, area balance counts, sitting minutes inside/outside work hours.
- game.js: awardQuestBonus level math.
- Existing 43 tests keep passing. Manual pass: full day simulation (quests appear, progress ticks, toast fires, shield chip, Progress page renders, sitting timer resets).

## Explicitly Deferred

- Adaptive quests from history (phase 3, slots into quests.js).
- Calendar integration, meeting-aware timeline, team challenges, FlowDesk dashboard restructure and palette, native mobile app, classes, Mystery Break Box.
