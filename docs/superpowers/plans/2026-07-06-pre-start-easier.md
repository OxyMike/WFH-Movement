# Pre-Start Easier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Easier button work while resting (before a quest starts), shrinking the suggested quest's time and docking its XP proportionally, without touching the existing live-Easier behavior.

**Architecture:** One new pure function in `rotation.js` (`easierQuestWithXpCut`) wraps the existing `easierQuest` and docks XP by the same ratio the duration shrank. `app.js`'s existing `btn-live-easier` click handler gains a branch for the resting case; `renderRestingRail()` gains a visibility toggle for the button, mirroring the toggle `startQuest` already does for the live case.

**Tech Stack:** Vanilla JS, ES modules, no build step. Zero-dependency test runner (`tests/run.js`), run via `node tests/<name>.test.js`.

## Global Constraints

- Live-Easier (`easierQuest`, the click branch where `liveQuest` is truthy) must not change at all — no XP docking, no restart-bug fix. Confirmed intentional per `tests/rotation.test.js:14` (`'reward is not docked for choosing easier'`).
- XP ratio must be exact: `newDuration / oldDuration`, not a flat halving.
- XP floors at a minimum of 1 (never 0).
- No new DOM elements or UI. The Primary Quest card's existing `#primary-quest-xp` label just needs to stay in sync — that's a refresh, not new UI.
- Spec: `docs/superpowers/specs/2026-07-06-pre-start-easier-design.md`

---

### Task 1: `easierQuestWithXpCut` in rotation.js

**Files:**
- Modify: `rotation.js` (add function after `easierQuest`, which ends at line 28)
- Test: `tests/rotation.test.js` (add cases after the existing `easierQuest` tests, before the `suggestExercise` tests start at line 46)

**Interfaces:**
- Consumes: `easierQuest(quest)` (existing, `rotation.js:22`) — returns `{ ...quest, steps, duration }` in minutes, or `null` if the quest is already too short to halve.
- Produces: `easierQuestWithXpCut(quest)` — same shape as `easierQuest`'s return, but `xp` is docked proportionally. Returns `null` under the same condition `easierQuest` does. `app.js` Task 2 calls this.

- [ ] **Step 1: Write the failing tests**

Add to `tests/rotation.test.js`, right after the existing `easierQuest returns null when the quest is already too short to halve` test (currently ends at line 44, before the `suggestExercise` tests):

```js
test('easierQuestWithXpCut docks xp by the exact duration ratio', () => {
  const q = EXERCISES.find(e => e.id === 'posture-reset'); // 4 min, xp 80
  const easy = easierQuestWithXpCut(q);
  const ratio = easy.duration / q.duration;
  assertEqual(easy.xp, Math.round(q.xp * ratio), 'xp must scale with the exact time ratio');
  assert(easy.xp < q.xp, 'xp must strictly decrease');
});

test('easierQuestWithXpCut floors xp at 1', () => {
  const q = { id: 'x', name: 'X', tier: 'easy', xp: 1, targetArea: 'back', duration: 2,
    steps: [{ title: 'a', duration: 60 }, { title: 'b', duration: 60 }] };
  const easy = easierQuestWithXpCut(q);
  assert(easy.xp >= 1, 'xp must never drop to 0');
});

test('easierQuestWithXpCut returns null exactly when easierQuest does', () => {
  const tiny = { id: 'x', name: 'X', tier: 'easy', xp: 10, targetArea: 'back', duration: 20 / 60,
    steps: [{ title: 'a', duration: 10 }, { title: 'b', duration: 10 }] };
  assertEqual(easierQuestWithXpCut(tiny), null);
});

test('easierQuestWithXpCut never mutates the input quest', () => {
  const q = { id: 'x', name: 'X', tier: 'easy', xp: 10, targetArea: 'back', duration: 2,
    steps: [{ title: 'a', duration: 60 }, { title: 'b', duration: 60 }] };
  const snapshot = JSON.stringify(q);
  easierQuestWithXpCut(q);
  assertEqual(JSON.stringify(q), snapshot, 'input must be untouched');
});
```

Also update the import line at the top of `tests/rotation.test.js` (currently line 3):

```js
import { suggestExercise, easierQuest, easierQuestWithXpCut } from '../rotation.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/rotation.test.js`
Expected: FAIL — `easierQuestWithXpCut is not a function` (or `undefined is not a function`), since it doesn't exist in `rotation.js` yet.

- [ ] **Step 3: Write the minimal implementation**

Add to `rotation.js`, immediately after `easierQuest` (which currently ends at line 28):

```js
// Like easierQuest, but also docks XP proportionally to the time cut.
// Used only for the pre-start (resting) Easier path; the live path keeps
// full XP by design (see the 'reward is not docked' test above).
export function easierQuestWithXpCut(quest) {
  const easy = easierQuest(quest);
  if (!easy) return null;
  const ratio = easy.duration / quest.duration;
  return { ...easy, xp: Math.max(1, Math.round(quest.xp * ratio)) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/rotation.test.js`
Expected: all tests PASS, including the 4 new ones and all pre-existing ones (`easierQuest` and `suggestExercise` tests untouched).

- [ ] **Step 5: Commit**

```bash
git add rotation.js tests/rotation.test.js
git commit -m "feat: add easierQuestWithXpCut for pre-start difficulty easing"
```

---

### Task 2: Wire the resting-state Easier button in app.js

**Files:**
- Modify: `app.js:2` (import line) — add `easierQuestWithXpCut` to the `rotation.js` import
- Modify: `app.js:490-494` (the `btn-live-easier` click handler)
- Modify: `app.js:527-531` (`renderRestingRail`, add the button visibility toggle)

**Interfaces:**
- Consumes: `easierQuestWithXpCut(quest)` from Task 1. `easierQuest(quest)` (existing, unchanged). `suggestedQuest` (existing module-level variable, `app.js:262`). `renderRestingRail()` and `renderPrimaryQuest()` (existing functions that read `suggestedQuest` and redraw the rail widget and Primary Quest card respectively — no changes needed to their bodies, just re-invoking them after `suggestedQuest` changes).
- Produces: nothing new consumed elsewhere — this is the outermost wiring layer.

- [ ] **Step 1: Update the rotation.js import**

In `app.js`, line 4 currently reads:

```js
import { suggestExercise, easierQuest } from './rotation.js';
```

Change to:

```js
import { suggestExercise, easierQuest, easierQuestWithXpCut } from './rotation.js';
```

- [ ] **Step 2: Branch the click handler on `liveQuest`**

Replace the existing handler at `app.js:490-494`:

```js
document.getElementById('btn-live-easier').addEventListener('click', () => {
  if (!liveQuest) return;
  const easier = easierQuest(liveQuest);
  if (easier) startQuest(easier);
});
```

with:

```js
document.getElementById('btn-live-easier').addEventListener('click', () => {
  if (!liveQuest) {
    const easier = easierQuestWithXpCut(suggestedQuest);
    if (!easier) return;
    suggestedQuest = easier;
    renderRestingRail();
    renderPrimaryQuest();
    sound(523, 150);
    return;
  }
  const easier = easierQuest(liveQuest);
  if (easier) startQuest(easier);
});
```

- [ ] **Step 3: Toggle button visibility in `renderRestingRail`**

In `app.js`, `renderRestingRail` currently reads (lines 527-531 shown, function continues past this):

```js
function renderRestingRail() {
  if (liveQuest) return;
  document.getElementById('live-quest-widget-header').textContent = restingHeaderText();
  document.getElementById('btn-live-pause').textContent = 'Start';
  if (!suggestedQuest) suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null, preferredAreasFrom(getTodayRecord().bodyStiffness));
```

Add the visibility toggle right after the `suggestedQuest` fallback line:

```js
function renderRestingRail() {
  if (liveQuest) return;
  document.getElementById('live-quest-widget-header').textContent = restingHeaderText();
  document.getElementById('btn-live-pause').textContent = 'Start';
  if (!suggestedQuest) suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null, preferredAreasFrom(getTodayRecord().bodyStiffness));
  document.getElementById('btn-live-easier').classList.toggle('hidden', !easierQuest(suggestedQuest));
```

Do not modify anything below this line in the function.

- [ ] **Step 4: Run the full test suite to confirm no regressions**

Run (from repo root):

```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```

Expected: every file prints `N passed, 0 failed`, no `FAILED:` lines. This is a DOM-touching change but the app.js module isn't imported by any test file, so this just confirms Task 1's tests and everything else still pass.

- [ ] **Step 5: Manual browser verification**

Start the static server (project root) and open it:

```bash
python -m http.server 4173
```

Then in the browser, or via the preview tool:
1. Load the app past onboarding (or use an existing saved profile).
2. On the Today view, note the Primary Quest card's `+NN XP` and the rail widget's countdown/title.
3. Click **Easier** on the rail widget while resting (before pressing Start). Confirm:
   - The rail widget's countdown time drops (roughly halved, floored per `easierQuest`'s existing rules).
   - The Primary Quest card's `+NN XP` also drops, by the same proportion.
   - Clicking Easier again compounds the reduction further, until the button hides itself (quest too short to halve further).
4. Press **Start** (rail's Pause/Start button) after easing. Confirm the live quest that begins matches the eased time/XP, not the original.
5. Reload the page mid-eased-state (before starting), confirm a rerolled or next-day suggestion resets to full difficulty (via existing `suggestExercise` calls) — i.e. the eased state doesn't leak forward.
6. Complete a quest normally (not eased) once, to confirm the ordinary live-Easier and quest-completion flows still behave exactly as before (no regression from the click-handler branch).

Expected: all of the above hold. If the button doesn't hide/show correctly, re-check Step 3's placement (must run every time `renderRestingRail` is called, including on initial load and after any suggestion change).

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: enable Easier button before a quest starts, docking XP"
```
