# Stiffness Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user tap the body zones that feel stiff and get a matching quest to start now, while biasing the rest of the day's suggestions toward those zones.

**Architecture:** Store today's stiff zones on the today record. Extend the existing `suggestExercise` picker with one optional `preferredAreas` param so both "recommend now" and "bias later" are the same call. Add a small scan panel to the Today view that writes the zones and refreshes the suggested quest.

**Tech Stack:** Vanilla ES modules, no build step, no dependencies. Tests are plain Node assert scripts run with `node tests/<name>.test.js`.

## Global Constraints

- No new dependencies, no build tooling. Plain ES modules loaded by `index.html`.
- The five body zones are exactly: `neck, shoulders, core, wrists, legs` (match quest `targetArea`).
- Tests use the existing harness: `import { test, run } from './run.js'`, mock `localStorage` for storage-touching tests, end the file with `run()`. Run one file with `node tests/<name>.test.js`.
- Audience is adults 60+: scan is tap-only, no typing, no reading required to act.
- On ship, bump the service worker cache version so installed PWA users don't get stale JS.

---

### Task 1: `preferredAreas` in `suggestExercise`

This one change powers both "recommend now" and "bias later" — they are the same call.

**Files:**
- Modify: `rotation.js:4-11`
- Test: `tests/stiffness.test.js` (create)

**Interfaces:**
- Produces: `suggestExercise(lastTargetArea, excludeId, tier, preferredAreas)` — `preferredAreas` is an optional array of zone strings. When non-empty and at least one candidate matches, the pick is restricted to those zones (still excluding `lastTargetArea` and `excludeId`). When empty/absent, behavior is unchanged.

- [ ] **Step 1: Write the failing tests**

Create `tests/stiffness.test.js`:

```js
import { test, run } from './run.js';
import { suggestExercise } from '../rotation.js';

test('suggestExercise restricts to a preferred zone when one matches', () => {
  for (let i = 0; i < 20; i++) {
    const e = suggestExercise(null, null, null, ['wrists']);
    if (e.targetArea !== 'wrists') throw new Error(`expected wrists, got ${e.targetArea}`);
  }
});

test('suggestExercise ignores empty preferredAreas (regression for existing callers)', () => {
  const e = suggestExercise('neck', null, null, []);
  if (!e || !e.targetArea) throw new Error('expected a valid exercise');
  if (e.targetArea === 'neck') throw new Error('should still avoid lastTargetArea');
});

test('suggestExercise falls back when no exercise matches a preferred zone', () => {
  const e = suggestExercise(null, null, null, ['nonexistent-zone']);
  if (!e || !e.targetArea) throw new Error('expected a fallback exercise, got none');
});

run();
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/stiffness.test.js`
Expected: FAIL — the preferred-zone test returns non-wrists exercises because the param is ignored.

- [ ] **Step 3: Implement the change**

Replace `rotation.js:4-11` with:

```js
export function suggestExercise(lastTargetArea, excludeId, tier, preferredAreas) {
  const inTier = tier ? EXERCISES.filter(e => e.tier === tier) : EXERCISES;
  let pool = inTier.filter(e => e.targetArea !== lastTargetArea && e.id !== excludeId);
  if (preferredAreas && preferredAreas.length) {
    const preferred = pool.filter(e => preferredAreas.includes(e.targetArea));
    if (preferred.length) pool = preferred;
  }
  if (pool.length === 0) pool = inTier.filter(e => e.id !== excludeId);
  if (pool.length === 0) pool = inTier;
  if (pool.length === 0) pool = EXERCISES;
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node tests/stiffness.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite for regressions**

Run: `node tests/rotation.test.js` (if present) and `node tests/insights.test.js`
Expected: PASS — existing callers pass no `preferredAreas`, so behavior is unchanged.

- [ ] **Step 6: Commit**

```bash
git add rotation.js tests/stiffness.test.js
git commit -m "feat: preferredAreas bias in suggestExercise"
```

---

### Task 2: Persist today's stiff zones

**Files:**
- Modify: `storage.js:48-55` (today-record default) and add a new export
- Test: `tests/stiffness-storage.test.js` (create)

**Interfaces:**
- Consumes: `getState`, `saveState`, `getTodayRecord` (existing).
- Produces:
  - `getTodayRecord()` now returns `stiffAreas: []` on a fresh day.
  - `saveStiffAreas(areas)` — persists `areas` onto today's record without disturbing `completedBreaks`/`lastTargetArea`.

- [ ] **Step 1: Write the failing tests**

Create `tests/stiffness-storage.test.js`:

```js
import { test, run } from './run.js';
import { resetAll, getTodayRecord, saveStiffAreas } from '../storage.js';

const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

test('fresh today record has empty stiffAreas', () => {
  resetAll();
  const rec = getTodayRecord();
  if (!Array.isArray(rec.stiffAreas) || rec.stiffAreas.length !== 0)
    throw new Error('expected stiffAreas []');
});

test('saveStiffAreas persists zones onto today record', () => {
  resetAll();
  saveStiffAreas(['neck', 'wrists']);
  const rec = getTodayRecord();
  if (rec.stiffAreas.join(',') !== 'neck,wrists')
    throw new Error(`expected neck,wrists got ${rec.stiffAreas}`);
});

run();
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/stiffness-storage.test.js`
Expected: FAIL — `saveStiffAreas` is not exported.

- [ ] **Step 3: Implement**

In `storage.js`, change the fresh return in `getTodayRecord` (line 52) to include `stiffAreas`:

```js
    return { date: today, completedBreaks: [], lastTargetArea: null, stiffAreas: [] };
```

Then add this export (place it right after `getTodayRecord`, before `logBreak`):

```js
export function saveStiffAreas(areas) {
  const state = getState() ?? {};
  const today = getTodayRecord();
  today.stiffAreas = areas;
  saveState({ ...state, today });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node tests/stiffness-storage.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/stiffness-storage.test.js
git commit -m "feat: persist daily stiffAreas on today record"
```

---

### Task 3: Scan panel UI + wiring

DOM wiring; the pickable logic it calls (`suggestExercise` with `preferredAreas`, `saveStiffAreas`) is already unit-tested in Tasks 1-2. Verify this task manually in the browser.

**Files:**
- Modify: `index.html` (insert scan block between line 150 and line 152, i.e. between the sitting-status card and the primary-quest card)
- Modify: `app.js` — import `saveStiffAreas`, add scan render + handlers, pass `stiffAreas` at the 5 `suggestExercise` call sites

**Interfaces:**
- Consumes: `saveStiffAreas` (Task 2), `suggestExercise(..., preferredAreas)` (Task 1), existing `getTodayRecord`, `renderPrimaryQuest`, `suggestedQuest`.

- [ ] **Step 1: Add the markup**

In `index.html`, insert between the sitting-status-card close (`</div>` at line 150) and the `<!-- Current Proposed Quest -->` comment (line 152):

```html
                        <!-- Stiffness scan -->
                        <div class="fd-card stiffness-scan-card">
                            <button class="btn-secondary" id="btn-open-scan">Feeling stiff?</button>
                            <div class="scan-panel hidden" id="scan-panel">
                                <p class="scan-prompt">Tap wherever it feels tight:</p>
                                <div class="scan-zones">
                                    <button class="scan-zone" data-zone="neck">Neck</button>
                                    <button class="scan-zone" data-zone="shoulders">Shoulders</button>
                                    <button class="scan-zone" data-zone="core">Core</button>
                                    <button class="scan-zone" data-zone="wrists">Wrists</button>
                                    <button class="scan-zone" data-zone="legs">Legs</button>
                                </div>
                                <button class="btn-primary" id="btn-scan-done">Done</button>
                            </div>
                        </div>
```

- [ ] **Step 2: Minimal styles**

Append to the main stylesheet (find the file `index.html` links via `<link rel="stylesheet">`; add near other `.fd-card`/button rules):

```css
.scan-panel { margin-top: 12px; }
.scan-zones { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 12px; }
.scan-zone { padding: 10px 16px; border-radius: 999px; border: 2px solid var(--border, #d8cfc4); background: transparent; font-size: 1rem; cursor: pointer; }
.scan-zone.selected { background: var(--accent, #c96f4a); color: #fff; border-color: var(--accent, #c96f4a); }
```

(Use the existing accent/border CSS variables if their names differ — grep the stylesheet for `--accent`/`--border` and match.)

- [ ] **Step 3: Wire the handlers in `app.js`**

Add `saveStiffAreas` to the storage import on line 3:

```js
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit, acknowledgeShieldUse, getState, saveState, localDateString, isWorkday, nextWorkdayName, saveStiffAreas } from './storage.js';
```

Add this block after the existing reroll/start handlers (after line 305):

```js
// Stiffness scan
document.getElementById('btn-open-scan').addEventListener('click', () => {
  const panel = document.getElementById('scan-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const stiff = getTodayRecord().stiffAreas || [];
    document.querySelectorAll('.scan-zone').forEach(b =>
      b.classList.toggle('selected', stiff.includes(b.dataset.zone)));
  }
});
document.querySelectorAll('.scan-zone').forEach(b =>
  b.addEventListener('click', () => b.classList.toggle('selected')));
document.getElementById('btn-scan-done').addEventListener('click', () => {
  const areas = [...document.querySelectorAll('.scan-zone.selected')].map(b => b.dataset.zone);
  saveStiffAreas(areas);
  document.getElementById('scan-panel').classList.add('hidden');
  const record = getTodayRecord();
  suggestedQuest = suggestExercise(record.lastTargetArea, null, null, areas);
  renderPrimaryQuest();
});
```

- [ ] **Step 4: Pass `stiffAreas` at the other suggest call sites**

Update these five `suggestExercise` calls to pass today's stiff zones so later suggestions stay biased. For each, add `getTodayRecord().stiffAreas` as the 4th arg (reusing the `record` variable where one is already in scope):

- `app.js:276` → `suggestExercise(record.lastTargetArea, null, null, record.stiffAreas)`
- `app.js:302` (reroll) → `suggestExercise(getTodayRecord().lastTargetArea, suggestedQuest?.id, null, getTodayRecord().stiffAreas)`
- `app.js:308` (startSuggestedQuest) → `suggestExercise(getTodayRecord().lastTargetArea, null, null, getTodayRecord().stiffAreas)`
- `app.js:317` (onReminderFires) → `suggestExercise(getTodayRecord().lastTargetArea, null, null, getTodayRecord().stiffAreas)`
- `app.js:424` and `app.js:443` → same pattern: add `, getTodayRecord().stiffAreas` as the 4th arg

(Line numbers shift as you edit — grep `suggestExercise(` in `app.js` to catch all call sites.)

- [ ] **Step 5: Manual verification**

Serve locally (e.g. `python -m http.server` or the project's usual local serve) and load `index.html`:
1. Today view shows a **"Feeling stiff?"** button.
2. Tapping it opens five zone buttons + Done.
3. Tap Neck + Wrists, they highlight; tap Done — panel closes and the "Up next" quest becomes a neck- or wrist-targeted quest.
4. Reopen the scan — Neck and Wrists are still highlighted.
5. Reroll a few times — suggestions stay within the stiff zones.

- [ ] **Step 6: Commit**

```bash
git add index.html app.js
# also add the stylesheet file you edited in Step 2
git commit -m "feat: stiffness scan panel on Today view"
```

---

### Task 4: Ship — bump service worker cache

**Files:**
- Modify: `service-worker.js` (cache version constant)

- [ ] **Step 1: Bump the version**

Grep `service-worker.js` for the cache name (currently `v9`) and bump it to `v10`. No new files were added (scan reuses existing JS/HTML/CSS already in the precache list), so the file list is unchanged — but confirm the stylesheet and all touched files are already listed.

- [ ] **Step 2: Verify the precache list**

Confirm `index.html`, `app.js`, `rotation.js`, `storage.js`, and the stylesheet are all in the precache array. Add any that are missing.

- [ ] **Step 3: Run the full test suite**

Run each `node tests/*.test.js` file.
Expected: all PASS, including the two new stiffness test files.

- [ ] **Step 4: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump service worker cache v9 -> v10 for stiffness scan"
```

---

## Self-Review

- **Spec coverage:** §1 data → Task 2. §2 scan UI → Task 3 Steps 1-2. §3 recommend now → Task 3 Step 3 (`saveStiffAreas` + `suggestExercise(..., areas)`). §4 bias later → Task 1 + Task 3 Step 4. §5 testing → Tasks 1-2 unit tests + Task 3 manual + Task 4 Step 3. §6 ship → Task 4. All covered.
- **Placeholder scan:** none — all steps carry real code and commands.
- **Type consistency:** `suggestExercise(lastTargetArea, excludeId, tier, preferredAreas)` and `saveStiffAreas(areas)` used identically across tasks; `stiffAreas` field name consistent throughout.
- **Note:** §3's "recommend-now picker" and §4's "bias" collapse into one call (`suggestExercise` with `preferredAreas`), so no separate picker function is built — intended simplification, keeps the diff small.
