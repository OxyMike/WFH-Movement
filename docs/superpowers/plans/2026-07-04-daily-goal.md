# Daily Goal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standing daily movement target (default 4 breaks, adjustable) with an always-visible progress ring on the Today view, a one-time celebration + small XP bonus on hit.

**Architecture:** Reuse the existing per-day `today` record (`completedBreaks[]`) as the progress source and the existing settings/XP/toast machinery. One pure predicate (`shouldAwardGoal`) carries all the testable logic; everything else is DOM wiring that mirrors patterns already in `app.js` (quest awards, the live-timer ring, the interval-minutes select).

**Tech Stack:** Vanilla ES modules, no framework. Tests are plain `node` scripts using the repo's `tests/run.js` harness (`import { test, run } from './run.js'`).

## Global Constraints

- No em dashes in any user-facing copy (Mike's rule).
- Celebration copy is exactly: `Goal met. {goal} breaks today. Your body thanks you.` where `{goal}` is the live target number.
- Default goal is `4`; goal counts every day (no workday gating).
- Goal bonus XP is `+15`, awarded at most once per day.
- Follow existing patterns; add no new dependencies and no new files beyond the one test file.
- Run tests with `node tests/<name>.test.js` from the repo root (`D:\ClaudeProjects\wfh-movement`).

---

### Task 1: Goal setting default + award predicate (logic + test)

**Files:**
- Modify: `storage.js` — add `dailyGoal` to `DEFAULT_SETTINGS`
- Modify: `game.js` — add exported `shouldAwardGoal`
- Test: `tests/daily-goal.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `shouldAwardGoal(record, goal)` → boolean, exported from `game.js`. Returns `true` iff the record has not yet been awarded and its `completedBreaks` length is at least `goal`. `record` is a today-record shape `{ completedBreaks: [...], goalAwarded?: boolean }`. Also produces `settings.dailyGoal` (number, default 4).

- [ ] **Step 1: Write the failing test**

Create `tests/daily-goal.test.js`:

```javascript
import { test, run } from './run.js';
import { shouldAwardGoal } from '../game.js';

test('shouldAwardGoal fires exactly at threshold, once', () => {
  const rec = (n, awarded = false) => ({ completedBreaks: Array(n).fill({}), goalAwarded: awarded });
  if (shouldAwardGoal(rec(3), 4)) throw new Error('should not award below goal');
  if (!shouldAwardGoal(rec(4), 4)) throw new Error('should award exactly at goal');
  if (!shouldAwardGoal(rec(5), 4)) throw new Error('should award when past goal');
  if (shouldAwardGoal(rec(4, true), 4)) throw new Error('should not award a second time');
});

test('shouldAwardGoal treats a missing completedBreaks as zero', () => {
  if (shouldAwardGoal({}, 1)) throw new Error('empty record must not award');
});

run();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/daily-goal.test.js`
Expected: FAIL — `shouldAwardGoal` is not exported (import is undefined, call throws `TypeError: shouldAwardGoal is not a function`).

- [ ] **Step 3: Add the predicate to `game.js`**

Append to `game.js` (after `getProgress`):

```javascript
// Daily goal: award once per day when today's break count reaches the target.
export function shouldAwardGoal(record, goal) {
  return !record.goalAwarded && (record.completedBreaks || []).length >= goal;
}
```

- [ ] **Step 4: Add the setting default to `storage.js`**

In `storage.js`, add `dailyGoal` to `DEFAULT_SETTINGS`:

```javascript
const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full',
  workDays: [1, 2, 3, 4, 5],
  dailyGoal: 4
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/daily-goal.test.js`
Expected: PASS (both tests).

- [ ] **Step 6: Confirm no regressions in the sibling logic tests**

Run: `node tests/game.test.js` and `node tests/storage.test.js`
Expected: both PASS unchanged.

- [ ] **Step 7: Commit**

```bash
git add game.js storage.js tests/daily-goal.test.js
git commit -m "feat: daily-goal setting default and award predicate"
```

---

### Task 2: Award the goal on the break-completion path

**Files:**
- Modify: `app.js` — import `shouldAwardGoal`; add `awardDailyGoal()`; call it in `completeQuest`

**Interfaces:**
- Consumes: `shouldAwardGoal` from `game.js` (Task 1); existing `getSettings`, `getTodayRecord`, `getState`, `saveState`, `awardQuestBonus`, `showXpToast`.
- Produces: `awardDailyGoal()` (no return); sets `today.goalAwarded = true` when it fires.

- [ ] **Step 1: Extend the `game.js` import in `app.js`**

Change line 7 of `app.js` from:

```javascript
import { awardBreak, awardQuestBonus, getProgress, getUnlocks, skipXpFactor } from './game.js';
```

to:

```javascript
import { awardBreak, awardQuestBonus, getProgress, getUnlocks, skipXpFactor, shouldAwardGoal } from './game.js';
```

- [ ] **Step 2: Add `awardDailyGoal()` next to `awardNewQuestCompletions`**

Immediately after the `awardNewQuestCompletions` function (ends at the line with `saveState({ ...(getState() || {}), today: record });` around line 539), add:

```javascript
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

(The `·` is the same middle-dot separator used by the quest and break toasts. This is a separator glyph, not an em dash.)

- [ ] **Step 3: Call it from `completeQuest`**

In `completeQuest`, add the call right after `awardNewQuestCompletions();` (line 407):

```javascript
    awardNewQuestCompletions();
    awardDailyGoal();
```

- [ ] **Step 4: Manual verification in the browser**

Serve the app (`npx http-server -p 8123 .` from repo root, or the launch config) and open it. In Settings, confirm goal is 4. Complete 4 movement breaks (finish each live quest). Expected: on the 4th completion a toast reads `Goal met. 4 breaks today. Your body thanks you.` Complete a 5th break. Expected: NO goal toast the second time (only the normal `+XP` toast). Reload and repeat a break past 4: still no re-award.

- [ ] **Step 5: Confirm logic tests still pass**

Run: `node tests/daily-goal.test.js`
Expected: PASS (unchanged; this task adds no new unit logic).

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: award daily-goal bonus and celebration on break completion"
```

---

### Task 3: Goal progress ring on the Today view

**Files:**
- Modify: `index.html` — add ring markup to the right slot of `sitting-status-card`
- Modify: `app.js` — add `renderGoalRing()` and call it from `renderToday`
- Modify: `style.css` — ring styles

**Interfaces:**
- Consumes: `getSettings().dailyGoal`, `getTodayRecord().completedBreaks` (Task 1).
- Produces: `renderGoalRing()` (no return); updates DOM elements `goal-ring-progress`, `goal-ring-count`, `goal-ring-container`.

- [ ] **Step 1: Add the ring markup to the sitting-status card**

In `index.html`, the `sitting-status-card` (around lines 134-140) currently holds only `sitting-status-left`. Add a right slot as the second child, immediately before the closing `</div>` of the card (after the `sitting-status-left` div ends at line 139):

```html
                          <div class="goal-ring-container" id="goal-ring-container">
                            <svg class="goal-ring-svg" width="72" height="72">
                              <circle class="goal-ring-bg" cx="36" cy="36" r="30"></circle>
                              <circle class="goal-ring-progress" id="goal-ring-progress" cx="36" cy="36" r="30" stroke-dasharray="188" stroke-dashoffset="188"></circle>
                            </svg>
                            <div class="goal-ring-text">
                              <span class="goal-ring-count" id="goal-ring-count">0 / 4</span>
                            </div>
                            <div class="goal-ring-label">breaks today</div>
                          </div>
```

- [ ] **Step 2: Add `renderGoalRing()` to `app.js`**

Add near `renderToday` (after `renderPrimaryQuest`, around line 286):

```javascript
function renderGoalRing() {
  const goal = getSettings().dailyGoal;
  const done = (getTodayRecord().completedBreaks || []).length;
  const CIRC = 188; // 2 * PI * r, r=30
  const pct = Math.min(1, done / goal);
  document.getElementById('goal-ring-progress').style.strokeDashoffset = String(CIRC * (1 - pct));
  document.getElementById('goal-ring-count').textContent = `${Math.min(done, goal)} / ${goal}`;
  document.getElementById('goal-ring-container').classList.toggle('met', done >= goal);
}
```

- [ ] **Step 3: Call it from `renderToday`**

In `renderToday`, add `renderGoalRing();` right after `renderDailyQuests();` (line 276):

```javascript
  renderPrimaryQuest();
  renderDailyQuests();
  renderGoalRing();
  tickToday();
```

- [ ] **Step 4: Add the ring styles to `style.css`**

Append (near the `.sitting-status-*` block around line 365, or at end of file):

```css
.goal-ring-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.goal-ring-svg {
  transform: rotate(-90deg);
}
.goal-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 6;
}
.goal-ring-progress {
  fill: none;
  stroke: var(--coral);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}
.goal-ring-text {
  position: absolute;
  top: 36px;               /* vertical center of the 72px svg */
  left: 0;
  right: 0;
  transform: translateY(-50%);
  text-align: center;
  pointer-events: none;
}
.goal-ring-count {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 15px;
}
.goal-ring-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}
.goal-ring-container.met .goal-ring-progress {
  filter: drop-shadow(0 0 5px var(--coral));
}
```

- [ ] **Step 5: Manual verification in the browser**

Reload the Today view. Expected: the navy sitting-status card now shows a ring on the right reading `N / 4` with "breaks today" beneath, N = today's break count. Complete a break: ring advances one segment and the count increments on return to Today. At 4/4 the ring is full and gains a soft coral glow.

- [ ] **Step 6: Commit**

```bash
git add index.html app.js style.css
git commit -m "feat: daily-goal progress ring on Today view"
```

---

### Task 4: Adjustable daily-goal setting

**Files:**
- Modify: `index.html` — add a `settings-item` with a `settings-daily-goal` select
- Modify: `app.js` — populate it in `renderSettings`, read it in the save handler

**Interfaces:**
- Consumes: `getSettings().dailyGoal`, `saveSettings` (existing).
- Produces: user-selected `dailyGoal` persisted through the existing settings save path; ring and award pick it up on next render.

- [ ] **Step 1: Add the settings row to `index.html`**

After the reminder-style `settings-item` (closes at line 362) and before the Sound `settings-item` (line 363), insert:

```html
                            <div class="settings-item">
                              <div class="settings-label">Daily movement goal</div>
                              <div class="settings-description">How many breaks make a good day. The ring on Today fills toward this.</div>
                              <div class="settings-input-row">
                                <select class="settings-select" id="settings-daily-goal">
                                  <option value="2">2 breaks</option>
                                  <option value="3">3 breaks</option>
                                  <option value="4">4 breaks</option>
                                  <option value="5">5 breaks</option>
                                  <option value="6">6 breaks</option>
                                  <option value="8">8 breaks</option>
                                </select>
                              </div>
                            </div>
```

(The select realizes the spec's 1-10 range as a practical set of discrete options, mirroring how the interval control offers 30/45/60/90 rather than every minute.)

- [ ] **Step 2: Populate the select in `renderSettings`**

In `renderSettings`, after the `settings-interval-minutes` line (line 159), add:

```javascript
  document.getElementById('settings-daily-goal').value = String(s.dailyGoal);
```

- [ ] **Step 3: Read the select in the save handler**

In the `btn-save-settings` click handler's `saveSettings({...})` object (around lines 180-189), add a `dailyGoal` field after `intervalMinutes`:

```javascript
    intervalMinutes: parseInt(document.getElementById('settings-interval-minutes').value, 10),
    dailyGoal: parseInt(document.getElementById('settings-daily-goal').value, 10),
```

- [ ] **Step 4: Manual verification in the browser**

Open Settings. Expected: "Daily movement goal" shows 4 selected. Change it to 3 and Save. Return to Today: ring now reads `N / 3`. Complete breaks until 3 are done: `Goal met. 3 breaks today. Your body thanks you.` fires. Reopen Settings: still shows 3 (persisted). Reload the page: still 3.

- [ ] **Step 5: Full test sweep**

Run every test file to confirm nothing regressed:

```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```

Expected: all pass, no `FAILED:` lines.

- [ ] **Step 6: Commit**

```bash
git add index.html app.js
git commit -m "feat: adjustable daily movement goal in settings"
```

---

## Notes for the implementer

- The `today` record is date-keyed and rebuilt fresh each day by `getTodayRecord`, so `goalAwarded` resets automatically at midnight. No cleanup code needed.
- Ordering in `completeQuest` matters: `awardDailyGoal()` runs before `showTab('today')` re-renders, so the goal toast is the last toast shown (most prominent) and the ring reflects the new count on the re-render.
- Do not add goal bonus XP anywhere else. The `+15` compounds an already-fast level curve (see `docs/HANDOFF.md`); rebalancing `LEVELS` is a separate follow-up task, out of scope here.
