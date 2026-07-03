# Antigravity UI Merge (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the WFH Movement shell with the Antigravity redesign, rewire all existing logic into it, and port the 28-quest library plus 14 animated SVG figures as real app data.

**Architecture:** The Antigravity HTML/CSS become the new `index.html`/`style.css` (adapted for PWA, responsive, and Phase 2 removals). The mock Antigravity `app.js` is discarded; the real `app.js` keeps its module imports and gets its DOM-binding layer rewritten. A one-time Node port script extracts the quest library, step templates, and SVG figures from the example into `exercises.js` and a new `figures.js`.

**Tech Stack:** Vanilla HTML/CSS/JS, ES modules, no build tools, no dependencies. localStorage persistence. Node for tests (`node tests/<file>.test.js`).

**Spec:** `docs/superpowers/specs/2026-07-03-antigravity-ui-merge-design.md` — read it before starting any task.

## Global Constraints

- Repo: `D:\ClaudeProjects\wfh-movement`, branch `ui-overhaul`. Never commit to `main`.
- No frameworks, no npm dependencies, no build step. Plain ES modules loaded by the browser.
- localStorage key stays `'wfh-movement'`. Existing user state must keep working unmodified.
- Area taxonomy everywhere: `neck | shoulders | core | wrists | legs`. Legacy names map on read: `hips→legs`, `spine→core`, `cardio→legs`.
- Quest categories: `mobility | stretch | strength | quiet`. Tiers (difficulty): `easy | medium | hard`.
- Unlock pack ladder: Mobility level 1, Quiet level 2, Stretch level 4, Strength level 6. Presentational only; nothing is ever unusable.
- No em dashes in any user-facing copy. Voice: direct and encouraging, matter-of-fact about the science, warm about the human.
- Source of truth for look/markup: `Frontendexampleantigravity/frontendexample.html` and its `style.css`. Its `app.js` is reference-only (content + injection patterns), never imported.
- Phase 2 features stay OUT of the DOM: stiffness scan card, coach insights card, combo meter, quest search, "Calendar Synced" chip, movement restrictions, daily goal, body-scan and movement-pref onboarding slides.
- Every commit leaves all tests passing: `node tests/exercises.test.js && node tests/figures.test.js && node tests/game.test.js && node tests/insights.test.js && node tests/quests.test.js && node tests/rotation.test.js && node tests/storage.test.js && node tests/reminder.test.js && node tests/timer.test.js` (run each; the runner exits 1 on failure).

---

### Task 1: Checkpoint the in-flight cleanup

**Files:**
- Modify: none (commit existing working-tree changes to `index.html`, `style.css`)

**Interfaces:**
- Produces: a clean working tree so the shell replacement in Tasks 6–7 starts from a committed baseline.

- [ ] **Step 1: Verify what is uncommitted**

Run: `git -C D:\ClaudeProjects\wfh-movement status`
Expected: `index.html` and `style.css` modified; `Frontendexampleantigravity/` untracked; nothing else.

- [ ] **Step 2: Commit the checkpoint**

```bash
git add index.html style.css
git commit -m "wip: styling cleanup checkpoint before Antigravity merge"
```

- [ ] **Step 3: Track the example folder as reference**

```bash
git add Frontendexampleantigravity
git commit -m "chore: Antigravity frontend example as merge reference"
```

This preserves the design source in history; the folder is deleted in Task 12.

---

### Task 2: Port the quest library and figures (`exercises.js`, `figures.js`)

**Files:**
- Create: `tools/port-antigravity.mjs` (deleted in Task 12)
- Create: `figures.js`
- Modify: `exercises.js` (content fully replaced)
- Test: `tests/exercises.test.js` (rewritten), `tests/figures.test.js` (new)

**Interfaces:**
- Consumes: `Frontendexampleantigravity/app.js` constants `QUESTS_LIBRARY` (~line 127), `STEP_TEMPLATES` (~line 802), `MOVEMENT_SVGS` (~line 912).
- Produces: `export const EXERCISES` — array of 28 objects `{ id, name, category, tier, xp, duration, targetArea, desc, steps }` where `steps` is `[{ title, desc, duration, animation, svg }]` and step durations sum to `duration * 60`. `figures.js` exports `export const FIGURES` (object of 14 SVG strings keyed `shoulders|neck|wrist|twist|legs|squats|pushups|march|sidebend|eyes|calf|lunge|rebound|lungs`) and `export function getFigure(key)` returning `FIGURES[key] || FIGURES.shoulders`. `rotation.js` keeps importing `EXERCISES` and filtering on `tier`/`targetArea` unchanged.

- [ ] **Step 1: Rewrite `tests/exercises.test.js` as failing tests for the new schema**

```javascript
import { test, run, assert, assertEqual } from './run.js';
import { EXERCISES } from '../exercises.js';
import { FIGURES } from '../figures.js';

const CATEGORIES = new Set(['mobility', 'stretch', 'strength', 'quiet']);
const AREAS = new Set(['neck', 'shoulders', 'core', 'wrists', 'legs']);
const TIERS = new Set(['easy', 'medium', 'hard']);

test('28 quests, unique ids', () => {
  assertEqual(EXERCISES.length, 28);
  assertEqual(new Set(EXERCISES.map(e => e.id)).size, 28);
});

test('every quest has valid category, area, tier, xp, duration, desc', () => {
  for (const e of EXERCISES) {
    assert(CATEGORIES.has(e.category), `${e.id}: bad category ${e.category}`);
    assert(AREAS.has(e.targetArea), `${e.id}: bad area ${e.targetArea}`);
    assert(TIERS.has(e.tier), `${e.id}: bad tier ${e.tier}`);
    assert(Number.isFinite(e.xp) && e.xp > 0, `${e.id}: bad xp`);
    assert(Number.isFinite(e.duration) && e.duration > 0, `${e.id}: bad duration`);
    assert(typeof e.desc === 'string' && e.desc.length > 0, `${e.id}: missing desc`);
  }
});

test('every quest has steps whose durations sum to duration minutes', () => {
  for (const e of EXERCISES) {
    assert(Array.isArray(e.steps) && e.steps.length > 0, `${e.id}: no steps`);
    const sum = e.steps.reduce((s, st) => s + st.duration, 0);
    assertEqual(sum, e.duration * 60, `${e.id}: steps sum ${sum} != ${e.duration * 60}`);
  }
});

test('every step names an existing figure', () => {
  for (const e of EXERCISES) {
    for (const st of e.steps) {
      assert(st.svg in FIGURES, `${e.id}: unknown figure ${st.svg}`);
      assert(typeof st.title === 'string' && st.title.length > 0, `${e.id}: step missing title`);
    }
  }
});

test('spec target-area assignments hold', () => {
  const expect = {
    'posture-reset': 'shoulders', 'wrist-stretch': 'wrists', 'back-twist': 'core',
    'calf-raises': 'legs', 'seated-plank': 'core', 'eye-focus': 'neck',
    'shoulder-rolls': 'shoulders', 'deep-breaths': 'core', 'seated-spinal-twist': 'core',
    'figure-4-stretch': 'legs', 'chin-tucks': 'neck', 'wrist-extensor': 'wrists',
    'glute-squeezes': 'legs', 'scapular-retractions': 'shoulders', 'doorway-stretch': 'shoulders',
    'side-bends': 'core', 'hip-flexor-stretch': 'legs', 'hamstring-sweeps': 'legs',
    'sit-to-stand': 'legs', 'standing-calf-raises': 'legs', 'air-squats': 'legs',
    'leg-extensions': 'legs', 'desk-pushups': 'shoulders', 'stair-climbing': 'legs',
    'desk-plank': 'core', 'high-knees': 'legs', 'rebounding': 'legs', 'pacing': 'legs'
  };
  for (const [id, area] of Object.entries(expect)) {
    const e = EXERCISES.find(x => x.id === id);
    assert(e, `missing quest ${id}`);
    assertEqual(e.targetArea, area, `${id}`);
  }
});

run();
```

- [ ] **Step 2: Write `tests/figures.test.js` (failing)**

```javascript
import { test, run, assert, assertEqual } from './run.js';
import { FIGURES, getFigure } from '../figures.js';

const KEYS = ['shoulders', 'neck', 'wrist', 'twist', 'legs', 'squats', 'pushups',
  'march', 'sidebend', 'eyes', 'calf', 'lunge', 'rebound', 'lungs'];

test('all 14 figure keys exist and are svg markup', () => {
  assertEqual(Object.keys(FIGURES).length, 14);
  for (const k of KEYS) {
    assert(k in FIGURES, `missing ${k}`);
    assert(FIGURES[k].trim().startsWith('<svg'), `${k} is not svg`);
  }
});

test('getFigure falls back to shoulders', () => {
  assertEqual(getFigure('no-such-key'), FIGURES.shoulders);
  assertEqual(getFigure('eyes'), FIGURES.eyes);
});

run();
```

- [ ] **Step 3: Run both to verify they fail**

Run: `node tests/exercises.test.js` and `node tests/figures.test.js`
Expected: FAIL (old schema / missing figures.js module).

- [ ] **Step 4: Write the port script `tools/port-antigravity.mjs`**

```javascript
// tools/port-antigravity.mjs -- one-time extraction of quest content from the
// Antigravity example into exercises.js and figures.js. Delete after the merge.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('Frontendexampleantigravity/app.js', 'utf8');

function extract(name) {
  const declIdx = src.indexOf(`const ${name} =`);
  if (declIdx === -1) throw new Error(`${name} not found`);
  const openIdx = src.slice(declIdx).search(/[\[{]/) + declIdx;
  const open = src[openIdx];
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = null, i = openIdx;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) break;
  }
  return new Function(`return ${src.slice(openIdx, i + 1)};`)();
}

const TARGET_AREAS = {
  'posture-reset': 'shoulders', 'wrist-stretch': 'wrists', 'back-twist': 'core',
  'calf-raises': 'legs', 'seated-plank': 'core', 'eye-focus': 'neck',
  'shoulder-rolls': 'shoulders', 'deep-breaths': 'core', 'seated-spinal-twist': 'core',
  'figure-4-stretch': 'legs', 'chin-tucks': 'neck', 'wrist-extensor': 'wrists',
  'glute-squeezes': 'legs', 'scapular-retractions': 'shoulders', 'doorway-stretch': 'shoulders',
  'side-bends': 'core', 'hip-flexor-stretch': 'legs', 'hamstring-sweeps': 'legs',
  'sit-to-stand': 'legs', 'standing-calf-raises': 'legs', 'air-squats': 'legs',
  'leg-extensions': 'legs', 'desk-pushups': 'shoulders', 'stair-climbing': 'legs',
  'desk-plank': 'core', 'high-knees': 'legs', 'rebounding': 'legs', 'pacing': 'legs'
};

const library = extract('QUESTS_LIBRARY');
const stepTemplates = extract('STEP_TEMPLATES');
const svgs = extract('MOVEMENT_SVGS');

const quests = library.map(q => {
  const area = TARGET_AREAS[q.id];
  if (!area) throw new Error(`no target area for ${q.id}`);
  const steps = (stepTemplates[q.id] || stepTemplates.default).map(s => ({ ...s }));
  // Make step durations sum exactly to the quest duration by adjusting the last step.
  const want = q.duration * 60;
  const sum = steps.reduce((s, st) => s + st.duration, 0);
  steps[steps.length - 1].duration += want - sum;
  if (steps[steps.length - 1].duration <= 0) throw new Error(`${q.id}: step durations exceed quest duration`);
  return {
    id: q.id, name: q.name, category: q.category,
    tier: q.difficulty.toLowerCase(), xp: q.xp, duration: q.duration,
    targetArea: area, desc: q.desc, steps
  };
});

writeFileSync('exercises.js',
  '// exercises.js -- quest library ported from the Antigravity redesign (2026-07-03)\n' +
  '// See docs/superpowers/specs/2026-07-03-antigravity-ui-merge-design.md\n' +
  'export const EXERCISES = ' + JSON.stringify(quests, null, 2) + ';\n');

const figureEntries = Object.entries(svgs)
  .map(([k, v]) => `  ${k}: \`${v.replace(/`/g, '\\`')}\``).join(',\n');
writeFileSync('figures.js',
  '// figures.js -- 14 animated SVG movement archetypes from the Antigravity redesign\n' +
  `export const FIGURES = {\n${figureEntries}\n};\n\n` +
  'export function getFigure(key) {\n  return FIGURES[key] || FIGURES.shoulders;\n}\n');

console.log(`ported ${quests.length} quests, ${Object.keys(svgs).length} figures`);
```

- [ ] **Step 5: Run the port script**

Run: `node tools/port-antigravity.mjs`
Expected: `ported 28 quests, 14 figures`. If a "step durations exceed quest duration" error fires, the example data disagrees with itself; fix by scaling that quest's step durations proportionally instead, and note it in the commit message.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node tests/exercises.test.js` then `node tests/figures.test.js`
Expected: all PASS.

- [ ] **Step 7: Run the rotation tests (consumer of EXERCISES)**

Run: `node tests/rotation.test.js`
Expected: PASS. If a rotation test asserts old exercise ids or areas, update those assertions to use new ids (e.g. `chin-tucks`, area `core`), keeping the behaviors under test identical.

- [ ] **Step 8: Commit**

```bash
git add exercises.js figures.js tools/port-antigravity.mjs tests/exercises.test.js tests/figures.test.js tests/rotation.test.js
git commit -m "feat: port 28-quest library and 14 animated figures from Antigravity example"
```

---

### Task 3: Per-quest XP, unlock packs, new area math (`game.js`, `insights.js`)

**Files:**
- Modify: `game.js`, `insights.js`
- Test: `tests/game.test.js`, `tests/insights.test.js`

**Interfaces:**
- Consumes: `EXERCISES` from Task 2 (for pack contents).
- Produces: `awardBreak(xp)` (number in, same return shape as before: `{ xpGained, totalXp, level, leveledUp, title }`); `UNLOCK_PACKS` and `getUnlocks()` → `[{ category, label, level, unlocked, quests: [name] }]`; `recordDaySummary({ date, minutes, targetArea })`; `getAreaBalance(now)` → `[{ area, count }]` over the five new zones with legacy mapping. `TIER_XP` and `TIER_DURATION` are deleted; nothing may import them afterward.

- [ ] **Step 1: Update `tests/game.test.js`**

Keep the localStorage mock and the LEVELS/levelForXp/getProgress tests as they are. Replace the two tier-based tests and add unlock tests:

```javascript
// REPLACE the 'tier XP and durations match spec' test with:
test('awardBreak takes an xp amount', () => {
  resetAll();
  const first = awardBreak(80);
  if (first.xpGained !== 80 || first.totalXp !== 80) throw new Error('bad first award');
  if (first.level !== 1 || first.leveledUp) throw new Error('should still be level 1');
  const r = awardBreak(40); // 120 total -> level 2
  if (r.totalXp !== 120 || r.level !== 2 || !r.leveledUp) throw new Error('expected level-up at 120 xp');
});

// REPLACE awardBreak('hard')/awardBreak('medium') calls in remaining tests with
// awardBreak(35), awardBreak(20), and awardBreak-loop counts that reach the same totals.

// ADD:
test('unlock ladder: mobility 1, quiet 2, stretch 4, strength 6', () => {
  resetAll();
  const packAt = (unlocks, c) => unlocks.find(p => p.category === c);
  let u = getUnlocks();
  if (u.length !== 4) throw new Error('expected 4 packs');
  if (!packAt(u, 'mobility').unlocked) throw new Error('mobility open at level 1');
  if (packAt(u, 'quiet').unlocked || packAt(u, 'stretch').unlocked || packAt(u, 'strength').unlocked)
    throw new Error('others locked at level 1');
  awardBreak(100); // level 2
  u = getUnlocks();
  if (!packAt(u, 'quiet').unlocked) throw new Error('quiet opens at level 2');
  if (packAt(u, 'stretch').unlocked) throw new Error('stretch still locked at level 2');
  awardBreak(600); // 700 xp -> level 5
  u = getUnlocks();
  if (!packAt(u, 'stretch').unlocked) throw new Error('stretch open at level 5');
  if (packAt(u, 'strength').unlocked) throw new Error('strength still locked at level 5');
  awardBreak(300); // 1000 xp -> level 6
  u = getUnlocks();
  if (!packAt(u, 'strength').unlocked) throw new Error('strength opens at level 6');
});

test('packs list their quests by name', () => {
  const u = getUnlocks();
  for (const p of u) {
    if (!Array.isArray(p.quests) || p.quests.length === 0) throw new Error(`${p.category} pack empty`);
  }
});
```

Import `getUnlocks` (and drop `TIER_XP`, `TIER_DURATION` from the import line).

- [ ] **Step 2: Run to verify failure**

Run: `node tests/game.test.js`
Expected: FAIL (`getUnlocks` not exported; awardBreak still tier-based).

- [ ] **Step 3: Modify `game.js`**

Delete the `TIER_XP` and `TIER_DURATION` exports and the `BUFF_COPY` block if nothing references it after Task 9 (check with grep before deleting; keep if referenced). Replace `awardBreak` and add packs:

```javascript
import { EXERCISES } from './exercises.js';

function addXp(xpGained) {
  const prevXp = currentXp();
  const totalXp = prevXp + xpGained;
  const state = getState() || {};
  state.game = { xp: totalXp };
  saveState(state);
  const level = levelForXp(totalXp);
  return {
    xpGained, totalXp, level,
    leveledUp: level > levelForXp(prevXp),
    title: LEVELS[level - 1].title
  };
}

export function awardBreak(xp) { return addXp(xp); }
export function awardQuestBonus(xp) { return addXp(xp); }

export const UNLOCK_PACKS = [
  { category: 'mobility', label: 'Mobility Pack', level: 1 },
  { category: 'quiet', label: 'Quiet Pack', level: 2 },
  { category: 'stretch', label: 'Stretch Pack', level: 4 },
  { category: 'strength', label: 'Strength Pack', level: 6 }
];

export function getUnlocks() {
  const level = levelForXp(currentXp());
  return UNLOCK_PACKS.map(p => ({
    ...p,
    unlocked: level >= p.level,
    quests: EXERCISES.filter(e => e.category === p.category).map(e => e.name)
  }));
}
```

- [ ] **Step 4: Update `tests/insights.test.js` expectations**

Change any test calling `recordDaySummary({ date, tier, targetArea })` to `recordDaySummary({ date, minutes, targetArea })` with explicit minutes, and area assertions to the new zones. Add:

```javascript
test('legacy areas map on read: hips->legs, spine->core', () => {
  resetAll();
  recordDaySummary({ date: '2026-07-01', minutes: 2, targetArea: 'hips' });
  recordDaySummary({ date: '2026-07-01', minutes: 5, targetArea: 'spine' });
  const balance = getAreaBalance(new Date('2026-07-02T12:00:00'));
  const get = a => balance.find(b => b.area === a).count;
  if (get('legs') !== 1 || get('core') !== 1) throw new Error('legacy mapping failed');
});
```

- [ ] **Step 5: Modify `insights.js`**

```javascript
// Remove: import { TIER_DURATION } from './game.js';

const AREAS = ['neck', 'shoulders', 'core', 'wrists', 'legs'];
const LEGACY_AREAS = { hips: 'legs', spine: 'core', cardio: 'legs' };

function normalizeArea(area) {
  return LEGACY_AREAS[area] || area;
}

export function recordDaySummary({ date, minutes, targetArea }) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const day = log[date] || { count: 0, minutes: 0, areas: {} };
  day.count += 1;
  day.minutes += minutes || 0;
  const area = normalizeArea(targetArea);
  day.areas[area] = (day.areas[area] || 0) + 1;
  log[date] = day;
  state.dayLog = log;
  saveState(state);
}
```

And in `getAreaBalance`, normalize stored keys so old data lands in the new buckets:

```javascript
export function getAreaBalance(now) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const counts = Object.fromEntries(AREAS.map(a => [a, 0]));
  for (const date of lastNDates(now, 7)) {
    const areas = log[date]?.areas || {};
    for (const [raw, n] of Object.entries(areas)) {
      const a = normalizeArea(raw);
      if (a in counts) counts[a] += n;
    }
  }
  return AREAS.map(area => ({ area, count: counts[area] }));
}
```

- [ ] **Step 6: Run tests**

Run: `node tests/game.test.js` then `node tests/insights.test.js`
Expected: PASS both. Also run `node tests/storage.test.js` (unchanged module, confirms no accidental coupling).

- [ ] **Step 7: Commit**

```bash
git add game.js insights.js tests/game.test.js tests/insights.test.js
git commit -m "feat: per-quest XP, unlock packs, five-zone area math with legacy mapping"
```

---

### Task 4: Quest template areas (`quests.js`)

**Files:**
- Modify: `quests.js`
- Test: `tests/quests.test.js`

**Interfaces:**
- Consumes: break records whose `targetArea` is now one of the five new zones (Task 3 write path).
- Produces: `QUEST_TEMPLATES` with ids `legs` and `core` replacing `hips` and `spine`; `getTodaysQuests`/`evaluateQuests` signatures unchanged.

- [ ] **Step 1: Update the two templates in `quests.js`**

```javascript
  { id: 'legs', title: 'Wake up your legs', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'legs') },
  { id: 'core', title: 'Straighten the desk slump', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'core') },
```

And in `EASY_SATISFIABLE`, replace `'hips', 'spine'` with `'legs', 'core'`.

- [ ] **Step 2: Update `tests/quests.test.js`**

Change any assertions referencing template ids `hips`/`spine` or break areas `hips`/`spine` to `legs`/`core`. Keep the seeding and evaluation tests otherwise identical.

- [ ] **Step 3: Run tests**

Run: `node tests/quests.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add quests.js tests/quests.test.js
git commit -m "feat: quest templates use new area taxonomy (legs, core)"
```

---

### Task 5: New `index.html` from the Antigravity shell

**Files:**
- Modify: `index.html` (fully replaced)
- Reference: `Frontendexampleantigravity/frontendexample.html`, current committed `index.html` (landing content), spec Screens section

**Interfaces:**
- Produces: the DOM contract every later task binds to. Element ids that MUST exist (Tasks 7–10 depend on them): `view-landing`, `btn-start-setup-hero`, `onboarding-wizard`, `obs-1`..`obs-4`, `ob-name-input`, `ob-work-start`, `ob-work-end`, `ob-wd-0`..`ob-wd-6`, `ob-reminder-mode`, `ob-interval-minutes`, `ob-fixed-options`, `ob-fixed-time-input`, `ob-add-fixed-time`, `ob-fixed-times-list`, `btn-ob-next`, `btn-ob-back`, `btn-ob-finish`, `app-shell`, nav buttons `[data-tab]` (7), `current-view-title`, `view-today`, `dashboard-greeting`, `dashboard-quote-text`, `btn-quote-shuffle`, `dashboard-sitting-duration`, `sitting-status-card`, `today-seated-timer`, `next-break-line`, `primary-quest-title`, `primary-quest-description`, `primary-quest-time`, `primary-quest-xp`, `primary-quest-insight`, `btn-reroll-quest`, `btn-snooze-quest`, `btn-start-quest`, `daily-quests-board-container`, `view-quests`, `quests-library-filters`, `quests-library-container`, `view-calendar`, `view-team`, `view-rewards`, `rewards-level-val`, `rewards-level-title`, `rewards-unlocks-container`, `view-progress`, `stats-total-resets`, `stats-total-minutes`, `stats-current-streak`, `stats-adherence`, `muscle-neck`, `muscle-shoulders`, `muscle-core`, `muscle-wrists`, `muscle-legs`, `view-settings`, `settings-name-input`, `settings-work-start`, `settings-work-end`, `settings-wd-0`..`settings-wd-6`, `settings-reminder-mode`, `settings-interval-minutes`, `settings-fixed-options`, `settings-fixed-time-input`, `settings-add-fixed-time`, `settings-fixed-times-list`, `settings-sound-toggle`, `btn-save-settings`, `btn-reset-database`, `live-quest-widget`, `live-quest-illustration-container`, `timer-progress-circle`, `live-timer-countdown`, `live-quest-movement-title`, `live-quest-movement-desc`, `live-quest-dots`, `btn-live-pause`, `btn-live-skip`, `level-display-label`, `xp-display-label`, `xp-progress-fill-bar`, `shield-card`, `shield-desc-text`, `streak-counter-value`, `audio-mute-btn`, `audio-icon-muted`, `audio-icon-unmuted`, `sidebar-username`, `sidebar-avatar`, `xp-toast`.

- [ ] **Step 1: Start from the example**

```bash
cp Frontendexampleantigravity/frontendexample.html index.html
```

- [ ] **Step 2: Replace the `<head>`**

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="WFH Movement: timed movement breaks for people who work at a desk. Work For Health.">
    <title>WFH Movement: Work For Health</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#2E7D67">
</head>
```

(The Inter font @import lives in style.css already.)

- [ ] **Step 3: Add the landing view as the first child of `<body>`**

Wrap the example's `.app-container` in `<div id="app-shell" class="hidden">` ... `</div>`, and insert before it:

```html
<div id="view-landing" class="landing hidden">
  <div class="landing-hero">
    <div class="logo-container"><div class="logo-icon">W</div><div class="logo-text">WFH Movement</div></div>
    <h1 class="landing-title">Your body wasn't built to sit all day.</h1>
    <p class="landing-subtitle">Two minutes an hour fixes more than you think. Work For Health.</p>
    <button class="btn-primary landing-cta" id="btn-start-setup-hero">Start moving</button>
  </div>
  <div class="landing-science">
    <div class="fd-card">
      <h2 class="card-title">What one hour of sitting does</h2>
      <ul class="landing-facts">
        <li>🩸 Circulation drops by half, blood pools in your lower legs</li>
        <li>🔥 Your metabolism slides into energy-saving mode</li>
        <li>🧈 The enzyme that burns fat in your bloodstream switches off</li>
        <li>🍬 Your muscles stop clearing sugar from your blood</li>
        <li>🦴 Pressure on your spinal discs climbs higher than standing</li>
      </ul>
    </div>
    <div class="landing-grid">
      <div class="fd-card"><h4>Heart</h4><ul><li>54% higher heart attack risk</li><li>Stiffened arteries</li><li>Plaque buildup</li></ul></div>
      <div class="fd-card"><h4>Metabolism</h4><ul><li>Chronic high blood pressure</li><li>Midsection weight gain</li><li>Type 2 diabetes</li></ul></div>
      <div class="fd-card"><h4>Muscles and bones</h4><ul><li>Gluteal muscle wasting</li><li>Bone mineral loss</li><li>Early disc degeneration</li></ul></div>
      <div class="fd-card"><h4>Veins</h4><ul><li>Varicose veins</li><li>Deep vein blood clots</li></ul></div>
    </div>
    <div class="fd-card">
      <h2 class="card-title">Why your gym session is not enough</h2>
      <p>Breaking up sitting every 30 to 60 minutes with even two minutes of light movement improves blood glucose and triglycerides, even when total daily activity is identical. Frequency beats intensity here. Small movements spread across your day are not a consolation prize. They are the thing itself.</p>
      <button class="btn-primary" id="btn-start-setup-bottom" style="margin-top:16px;">Set up your reminders</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Remove Phase 2 elements from the Today view**

Delete: the stiffness scan card (`.sitting-status-card` with `stiffness-check-group`) and the coach insights block (`.timeline-container` with `coach-insight-headline`). In their place after the view header, add the real sitting/countdown card:

```html
<div class="fd-card sitting-status-card">
  <div class="sitting-status-left">
    <div class="sitting-title">Time seated since your last break</div>
    <div class="sitting-timer" id="today-seated-timer">–</div>
    <div class="sitting-badge" id="next-break-line">Next break soon</div>
  </div>
</div>
```

- [ ] **Step 5: Adjust the primary quest card**

Keep ids `primary-quest-title`, `primary-quest-description`, `primary-quest-time`, `primary-quest-xp`, `btn-reroll-quest`, `btn-start-quest`. Give the insight box's inner text div `id="primary-quest-insight"`. Change the tag text `Adherence recommendation` to `Up next`. In `.quest-buttons`, add before Reroll:

```html
<button class="btn-secondary hidden" id="btn-snooze-quest">Snooze 15 min</button>
```

- [ ] **Step 6: Replace the Calendar and Team sections with coming-soon panels**

```html
<section class="view-section" id="view-calendar">
  <div class="view-header">
    <h1 class="view-greeting">Calendar</h1>
    <p class="view-subtitle">Coming soon.</p>
  </div>
  <div class="fd-card coming-soon-card">
    <div class="coming-soon-icon">📅</div>
    <p>Meeting-aware breaks are on the way: your gaps between calls will become movement opportunities, scheduled for you.</p>
  </div>
</section>
<section class="view-section" id="view-team">
  <div class="view-header">
    <h1 class="view-greeting">Team</h1>
    <p class="view-subtitle">Coming soon.</p>
  </div>
  <div class="fd-card coming-soon-card">
    <div class="coming-soon-icon">👋</div>
    <p>Move together: shared streaks and privacy-safe encouragement for your desk crew. Not here yet, but planned.</p>
  </div>
</section>
```

Add class `nav-item-soon` to the Calendar and Team sidebar buttons (styled dimmed in Task 6).

- [ ] **Step 7: Rewards section ids**

Keep the structure; set `id="rewards-level-val"` on the level circle, add `id="rewards-level-title"` on the title paragraph (replacing the hardcoded `"The Body Defender"`), keep `rewards-unlocks-container`.

- [ ] **Step 8: Progress section stat ids**

Rename the third stat card: label `Current Streak`, value id `stats-current-streak` (replacing `stats-streaks-broken`, which celebrated broken streaks by mistake). Keep `stats-total-resets`, `stats-total-minutes`, `stats-adherence`, and the body map with `muscle-neck|shoulders|core|wrists|legs` paths. Remove the hardcoded `active-coverage` classes from the SVG paths (JS assigns them). Replace the hardcoded legend text with two spans: `id="legend-active-areas"` and `id="legend-focus-areas"`, plus the static sedentary insight paragraph kept as is.

- [ ] **Step 9: Replace the Settings section content**

```html
<section class="view-section" id="view-settings">
  <div class="view-header">
    <h1 class="view-greeting">Settings</h1>
    <p class="view-subtitle">Your name, your hours, your reminders.</p>
  </div>
  <div class="fd-card">
    <div class="settings-list">
      <div class="settings-item">
        <div class="settings-label">Your name</div>
        <div class="settings-description">How the dashboard greets you.</div>
        <div class="settings-input-row"><input type="text" id="settings-name-input" class="settings-select" style="width:200px;" placeholder="Your name"></div>
      </div>
      <div class="settings-item">
        <div class="settings-label">Work hours</div>
        <div class="settings-description">Reminders only fire inside this window.</div>
        <div class="settings-input-row">
          <input type="time" id="settings-work-start" class="settings-select">
          <span>to</span>
          <input type="time" id="settings-work-end" class="settings-select">
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-label">Workdays</div>
        <div class="settings-description">Streaks only count days you actually work.</div>
        <div class="settings-input-row workdays-row">
          <label><input type="checkbox" id="settings-wd-0">Sun</label>
          <label><input type="checkbox" id="settings-wd-1">Mon</label>
          <label><input type="checkbox" id="settings-wd-2">Tue</label>
          <label><input type="checkbox" id="settings-wd-3">Wed</label>
          <label><input type="checkbox" id="settings-wd-4">Thu</label>
          <label><input type="checkbox" id="settings-wd-5">Fri</label>
          <label><input type="checkbox" id="settings-wd-6">Sat</label>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-label">Reminder style</div>
        <div class="settings-description">A steady rhythm, or exact times you choose.</div>
        <div class="settings-input-row">
          <select class="settings-select" id="settings-reminder-mode">
            <option value="interval">Every so often</option>
            <option value="fixed">Fixed times</option>
          </select>
          <select class="settings-select" id="settings-interval-minutes">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>
        <div id="settings-fixed-options" class="hidden">
          <div class="settings-input-row">
            <input type="time" id="settings-fixed-time-input" class="settings-select">
            <button class="btn-secondary" id="settings-add-fixed-time">Add</button>
          </div>
          <div id="settings-fixed-times-list" class="chips-row"></div>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-label">Sound</div>
        <div class="settings-description">Chimes at the halfway point and when a break completes.</div>
        <div class="settings-input-row">
          <label class="shield-toggle"><input type="checkbox" id="settings-sound-toggle" checked><span class="toggle-slider"></span></label>
        </div>
      </div>
      <div class="settings-item">
        <button class="btn-primary" id="btn-save-settings">Save settings</button>
      </div>
      <div class="settings-item">
        <div class="settings-label">Start over</div>
        <div class="settings-description">Deletes your history, streaks, and settings on this device. There is no undo.</div>
        <div class="settings-input-row"><button class="btn-danger" id="btn-reset-database">Reset all data</button></div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 10: Replace the onboarding wizard slides**

Keep the overlay (`onboarding-wizard`) and card/slide classes. Four slides:

```html
<div class="onboarding-slide active-slide" id="obs-1">
  <div class="onboarding-header">
    <div class="onboarding-logo"><div class="logo-icon">W</div><span>WFH Movement</span></div>
    <h2 class="onboarding-title">First, your name</h2>
    <p class="onboarding-desc">So the app greets a person, not a user.</p>
  </div>
  <div class="onboarding-body">
    <input type="text" id="ob-name-input" class="settings-select" placeholder="Your name" style="max-width:280px;">
  </div>
</div>
<div class="onboarding-slide" id="obs-2">
  <div class="onboarding-header">
    <div class="onboarding-logo"><div class="logo-icon">W</div><span>WFH Movement</span></div>
    <h2 class="onboarding-title">Your work hours</h2>
    <p class="onboarding-desc">Reminders stay inside this window and rest when you do.</p>
  </div>
  <div class="onboarding-body">
    <div class="settings-input-row">
      <input type="time" id="ob-work-start" class="settings-select" value="09:00">
      <span>to</span>
      <input type="time" id="ob-work-end" class="settings-select" value="17:00">
    </div>
    <div class="settings-input-row workdays-row">
      <label><input type="checkbox" id="ob-wd-0">Sun</label>
      <label><input type="checkbox" id="ob-wd-1" checked>Mon</label>
      <label><input type="checkbox" id="ob-wd-2" checked>Tue</label>
      <label><input type="checkbox" id="ob-wd-3" checked>Wed</label>
      <label><input type="checkbox" id="ob-wd-4" checked>Thu</label>
      <label><input type="checkbox" id="ob-wd-5" checked>Fri</label>
      <label><input type="checkbox" id="ob-wd-6">Sat</label>
    </div>
  </div>
</div>
<div class="onboarding-slide" id="obs-3">
  <div class="onboarding-header">
    <div class="onboarding-logo"><div class="logo-icon">W</div><span>WFH Movement</span></div>
    <h2 class="onboarding-title">How should reminders arrive?</h2>
    <p class="onboarding-desc">A steady rhythm works for most people. You can change this anytime.</p>
  </div>
  <div class="onboarding-body">
    <div class="settings-input-row">
      <select class="settings-select" id="ob-reminder-mode">
        <option value="interval">Every so often</option>
        <option value="fixed">Fixed times</option>
      </select>
      <select class="settings-select" id="ob-interval-minutes">
        <option value="30">30 minutes</option>
        <option value="45" selected>45 minutes</option>
        <option value="60">60 minutes</option>
        <option value="90">90 minutes</option>
      </select>
    </div>
    <div id="ob-fixed-options" class="hidden">
      <div class="settings-input-row">
        <input type="time" id="ob-fixed-time-input" class="settings-select">
        <button class="btn-secondary" id="ob-add-fixed-time">Add</button>
      </div>
      <div id="ob-fixed-times-list" class="chips-row"></div>
    </div>
  </div>
</div>
<div class="onboarding-slide" id="obs-4">
  <div class="onboarding-header">
    <div class="onboarding-logo"><div class="logo-icon">W</div><span>WFH Movement</span></div>
    <h2 class="onboarding-title">Why movement gaps matter</h2>
    <p class="onboarding-desc">Small breaks trigger real biology.</p>
  </div>
  <div class="onboarding-body">
    <div class="educational-insight-box">
      <span class="insight-icon">🩺</span>
      <div class="insight-content">
        <div class="insight-title">Sitting is the problem, not you</div>
        <div class="insight-text">After 20 minutes of stillness, circulation slows and your postural muscles switch off. A morning workout does not undo an afternoon of sitting. Frequency is what your body is asking for.</div>
      </div>
    </div>
    <div class="educational-insight-box">
      <span class="insight-icon">🔔</span>
      <div class="insight-content">
        <div class="insight-title">One permission, worth granting</div>
        <div class="insight-text">Allow notifications and your reminders arrive even when this tab is buried. Prefer not to? The dashboard countdown works fine without them.</div>
      </div>
    </div>
  </div>
</div>
```

Below the slides, inside the card, the wizard controls:

```html
<div class="onboarding-controls">
  <button class="btn-secondary" id="btn-ob-back">Back</button>
  <button class="btn-primary" id="btn-ob-next">Next</button>
  <button class="btn-primary hidden" id="btn-ob-finish">Start moving</button>
</div>
```

- [ ] **Step 11: Top bar and right rail trims**

Remove the search container and the "Calendar Synced" status chip. Keep the streak badge and `audio-mute-btn`. In the right rail: remove the combo meter card. In the live quest widget, remove `btn-live-easier` and the pace pill. In the shield card, replace the toggle with status-only markup (`id="shield-card"`, keep `shield-desc-text`), because shields are earned every 5-day streak, not switched on:

```html
<div class="streak-shield-card" id="shield-card">
  <div class="shield-text-col">
    <span class="shield-title">Streak Shield</span>
    <span class="shield-desc" id="shield-desc-text">Earn one with a 5-day streak</span>
  </div>
  <span class="shield-emoji">🛡️</span>
</div>
```

In the sidebar footer, remove the `Premium Worker` role line; `sidebar-username` shows the name, and the role div gets `id="sidebar-level-title"` showing the level title.

- [ ] **Step 12: Toast and script tag**

Before `</body>`:

```html
<div id="xp-toast" class="xp-toast hidden"></div>
<script type="module" src="app.js"></script>
```

Remove the example's plain `<script src="app.js"></script>` if present.

- [ ] **Step 13: Sanity check and commit**

Run: `git diff --stat` to confirm only index.html changed, then open the file and verify all ids from the Interfaces block exist (`Select-String '"(view-landing|onboarding-wizard|btn-start-quest|settings-sound-toggle|xp-toast)"' index.html` spot check).

```bash
git add index.html
git commit -m "feat: Antigravity shell as index.html -- landing, wizard, coming-soon panels, PWA head"
```

Note: the app is broken at this commit (app.js still binds old ids). That is expected mid-sequence on this branch; Tasks 7–10 restore behavior.

---

### Task 6: New `style.css`

**Files:**
- Modify: `style.css` (fully replaced)
- Reference: `Frontendexampleantigravity/style.css`

**Interfaces:**
- Produces: all classes used by Task 5's markup, plus: `.hidden { display:none !important; }`, `.landing*` styles, `.coming-soon-card`, `.nav-item-soon`, `.workdays-row`, `.chips-row`, `.chip`, `.xp-toast`, `.onboarding-controls`, `.shield-emoji`, `.quest-pulse`, `.break-fullscreen` responsive behavior, bottom tab bar under 768px.

- [ ] **Step 1: Copy the example stylesheet**

```bash
cp Frontendexampleantigravity/style.css style.css
```

- [ ] **Step 2: Append the merge additions block**

```css
/* ===== Merge additions (landing, wizard controls, responsive, PWA) ===== */
.hidden { display: none !important; }

body { overflow: auto; height: auto; min-height: 100vh; }
.app-container { height: 100vh; }

/* Landing */
.landing { max-width: 860px; margin: 0 auto; padding: 48px 20px; }
.landing-hero { text-align: center; padding: 48px 0 32px; }
.landing-hero .logo-container { justify-content: center; margin-bottom: 24px; }
.landing-title { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; }
.landing-subtitle { color: var(--text-muted); font-size: 16px; margin: 12px 0 24px; }
.landing-cta { font-size: 16px; padding: 12px 28px; }
.landing-science { display: flex; flex-direction: column; gap: 16px; }
.landing-facts { list-style: none; line-height: 2.1; }
.landing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.landing-grid ul { padding-left: 18px; font-size: 13px; color: var(--text-muted); margin-top: 6px; }

/* Coming soon */
.coming-soon-card { text-align: center; padding: 40px 24px; color: var(--text-muted); }
.coming-soon-icon { font-size: 40px; margin-bottom: 12px; }
.nav-item-soon { opacity: 0.55; }

/* Settings extras */
.workdays-row { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; }
.workdays-row label { display: inline-flex; align-items: center; gap: 4px; }
.chips-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.chip { display: inline-flex; align-items: center; padding: 4px 12px; background: var(--primary-light); color: var(--primary); border-radius: 999px; font-size: 12.5px; cursor: pointer; }

/* Wizard controls */
.onboarding-controls { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }

/* Toast */
.xp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--navy); color: #fff; padding: 10px 20px; border-radius: 999px;
  font-size: 13.5px; box-shadow: var(--card-shadow); z-index: 300; }

/* Reminder pulse on the primary quest card */
@keyframes quest-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(243,107,84,0.35); } 50% { box-shadow: 0 0 0 10px rgba(243,107,84,0); } }
.quest-pulse { animation: quest-pulse 1.6s ease-in-out 3; border-color: var(--coral); }

.shield-emoji { font-size: 22px; }
.shield-inactive { opacity: 0.55; }

/* Responsive: sidebar becomes a bottom tab bar, right rail stacks */
@media (max-width: 900px) {
  .right-panel { width: 100%; border-left: none; border-top: 1px solid var(--border-color); }
  .content-body { flex-direction: column; overflow-y: auto; }
}
@media (max-width: 768px) {
  .app-container { flex-direction: column; height: auto; min-height: 100vh; }
  .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; width: 100%;
    flex-direction: row; padding: 0; z-index: 200; border-right: none; border-top: 1px solid var(--border-color); }
  .sidebar .logo-container, .sidebar .sidebar-footer { display: none; }
  .sidebar nav, .nav-list { display: flex; flex-direction: row; width: 100%; }
  .nav-list li { flex: 1; }
  .nav-item { flex-direction: column; gap: 2px; font-size: 10px; padding: 8px 2px; justify-content: center; }
  .main-wrapper { padding-bottom: 64px; }
  /* Active break takes the screen */
  body.break-active .center-content, body.break-active .top-bar, body.break-active .sidebar { display: none; }
  body.break-active .right-panel { width: 100%; border: none; }
}
```

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: Antigravity stylesheet with landing, responsive tab bar, merge additions"
```

---

### Task 7: `app.js` part 1 — boot, routing, tabs, wizard

**Files:**
- Modify: `app.js` (top-to-bottom rewrite of the binding layer begins here; keep all imports and add `getFigure`)

**Interfaces:**
- Consumes: DOM ids from Task 5; `isFirstVisit`, `getSettings`, `saveSettings`, `startReminderEngine` as today.
- Produces: `showTab(name)` for names `today|quests|calendar|team|rewards|progress|settings` (renders that view via the render functions Tasks 8–9 define; until then, stub renders as no-ops and wire them in later tasks); `startApp()`; wizard flow that saves `{ userName, workStart, workEnd, workDays, reminderMode, intervalMinutes, fixedTimes, muted: false }` and requests notification permission on finish. Settings schema note: `defaultBreakLength` is written no more but tolerated in old state.

- [ ] **Step 1: Replace the view management block**

```javascript
import { getFigure } from './figures.js';

const TABS = ['today', 'quests', 'calendar', 'team', 'rewards', 'progress', 'settings'];
const TAB_TITLES = {
  today: "Today's Quest Board", quests: 'Quests Library', calendar: 'Calendar',
  team: 'Team', rewards: 'Rewards', progress: 'Progress', settings: 'Settings'
};
const TAB_RENDERERS = {
  today: () => renderToday(),
  quests: () => renderLibrary(),
  rewards: () => renderRewards(),
  progress: () => renderProgress(),
  settings: () => renderSettings(),
  calendar: () => {}, team: () => {}
};

function showTab(name) {
  TABS.forEach(t => {
    document.getElementById('view-' + t).classList.toggle('active-view', t === name);
    document.querySelector(`.nav-item[data-tab="${t}"]`).classList.toggle('active', t === name);
  });
  document.getElementById('current-view-title').textContent = TAB_TITLES[name];
  TAB_RENDERERS[name]();
}

document.querySelectorAll('.nav-item[data-tab]').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));
```

(Note: the example toggles sections with the `active-view` class; verify the class name in the copied CSS and match it.)

- [ ] **Step 2: Wizard state machine**

```javascript
const WIZARD_SLIDES = ['obs-1', 'obs-2', 'obs-3', 'obs-4'];
let wizardIdx = 0;
let onboardingFixedTimes = [];

function showWizardSlide(i) {
  wizardIdx = i;
  WIZARD_SLIDES.forEach((id, n) =>
    document.getElementById(id).classList.toggle('active-slide', n === i));
  document.getElementById('btn-ob-back').classList.toggle('hidden', i === 0);
  document.getElementById('btn-ob-next').classList.toggle('hidden', i === WIZARD_SLIDES.length - 1);
  document.getElementById('btn-ob-finish').classList.toggle('hidden', i !== WIZARD_SLIDES.length - 1);
}

document.getElementById('btn-ob-next').addEventListener('click', () => showWizardSlide(wizardIdx + 1));
document.getElementById('btn-ob-back').addEventListener('click', () => showWizardSlide(wizardIdx - 1));

document.getElementById('ob-reminder-mode').addEventListener('change', function () {
  const fixed = this.value === 'fixed';
  document.getElementById('ob-interval-minutes').classList.toggle('hidden', fixed);
  document.getElementById('ob-fixed-options').classList.toggle('hidden', !fixed);
});

document.getElementById('ob-add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('ob-fixed-time-input');
  addTimeChip(input.value, document.getElementById('ob-fixed-times-list'), onboardingFixedTimes);
  input.value = '';
});

function completeOnboarding() {
  saveSettings({
    userName: document.getElementById('ob-name-input').value.trim(),
    workStart: document.getElementById('ob-work-start').value,
    workEnd: document.getElementById('ob-work-end').value,
    workDays: [0,1,2,3,4,5,6].filter(d => document.getElementById('ob-wd-' + d).checked),
    reminderMode: document.getElementById('ob-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('ob-interval-minutes').value, 10),
    fixedTimes: [...onboardingFixedTimes],
    muted: false
  });
  if ('Notification' in window) Notification.requestPermission().catch(() => {});
  document.getElementById('onboarding-wizard').classList.add('hidden');
  startApp();
}
document.getElementById('btn-ob-finish').addEventListener('click', completeOnboarding);
```

Keep the existing `addTimeChip` helper, changing its chip class to `chip` (CSS from Task 6) and dropping the inline `cssText`.

- [ ] **Step 3: Boot logic**

```javascript
function startApp() {
  document.getElementById('view-landing').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  showTab('today');
  updateTopBar();
  updateRail();
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(onReminderFires);
}

document.getElementById('btn-start-setup-hero').addEventListener('click', openWizard);
document.getElementById('btn-start-setup-bottom').addEventListener('click', openWizard);
function openWizard() {
  document.getElementById('onboarding-wizard').classList.remove('hidden');
  showWizardSlide(0);
}

const bootParam = new URLSearchParams(window.location.search).get('break');
if (isFirstVisit()) {
  document.getElementById('view-landing').classList.remove('hidden');
  document.getElementById('onboarding-wizard').classList.add('hidden');
} else {
  startApp();
  if (bootParam === 'start') startSuggestedQuest();
}
```

`updateTopBar`, `updateRail`, `onReminderFires`, `startSuggestedQuest`, and the renderers are defined in Tasks 8–9; stub any not yet written as empty functions so this commit runs.

- [ ] **Step 4: Manual check**

Serve: `npx http-server -p 8080 -c-1` (or any static server) and open http://localhost:8080. With cleared site data: landing shows, Start moving opens the wizard, finishing lands on an empty-ish Today. Tabs switch. Console has no errors.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: shell routing, landing boot, onboarding wizard flow"
```

---

### Task 8: `app.js` part 2 — Today view, break flow, live quest widget

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `suggestExercise(lastTargetArea, excludeId, tier)` with `tier=null`; `startTimer(seconds, onTick, onComplete)`; `awardBreak(quest.xp)`; `logBreak(id, targetArea, tier)`; `recordDaySummary({ date, minutes, targetArea })`; `getFigure(key)`; `getTodaysQuests`/`evaluateQuests`; `getSittingMinutes`; `getNextReminderMs`; `isWithinWorkWindow`.
- Produces: `renderToday()`, `startSuggestedQuest()`, `onReminderFires()`, `updateRail()`, `sound(freq, ms)` (mute-gated `playTone`). The POSITIVE_QUOTES port.

- [ ] **Step 1: Quotes**

Port the eight strings from `POSITIVE_QUOTES` in the example app.js (~line 1722) verbatim (voice pass happens in Task 11):

```javascript
const POSITIVE_QUOTES = [ /* eight strings from the example */ ];

function initQuote() {
  const el = document.getElementById('dashboard-quote-text');
  el.textContent = `"${POSITIVE_QUOTES[new Date().getDate() % POSITIVE_QUOTES.length]}"`;
}
document.getElementById('btn-quote-shuffle').addEventListener('click', () => {
  const el = document.getElementById('dashboard-quote-text');
  const current = el.textContent.replace(/"/g, '');
  const pool = POSITIVE_QUOTES.filter(q => q !== current);
  el.textContent = `"${pool[Math.floor(Math.random() * pool.length)]}"`;
});
```

- [ ] **Step 2: renderToday**

```javascript
let suggestedQuest = null;

function renderToday() {
  const settings = getSettings();
  const record = getTodayRecord();
  const name = settings.userName;
  const h = new Date().getHours();
  const dayPart = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashboard-greeting').textContent = name ? `${dayPart}, ${name}` : dayPart;
  initQuote();

  const mins = getSittingMinutes(new Date(), settings, record);
  document.getElementById('dashboard-sitting-duration').textContent =
    mins !== null ? `Sitting ${mins} min since your last break.` : 'Your chair misses you already. Good.';
  document.getElementById('today-seated-timer').textContent = mins !== null ? `${mins} min` : 'Fresh start';

  if (!suggestedQuest) suggestedQuest = suggestExercise(record.lastTargetArea, null, null);
  renderPrimaryQuest();
  renderDailyQuests();
}

function renderPrimaryQuest() {
  document.getElementById('primary-quest-title').textContent = suggestedQuest.name;
  document.getElementById('primary-quest-description').textContent = suggestedQuest.desc;
  document.getElementById('primary-quest-time').textContent = `${suggestedQuest.duration} min`;
  document.getElementById('primary-quest-xp').textContent = `+${suggestedQuest.xp} XP`;
  document.getElementById('primary-quest-insight').textContent = suggestedQuest.desc;
}

document.getElementById('btn-reroll-quest').addEventListener('click', () => {
  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, suggestedQuest?.id, null);
  renderPrimaryQuest();
});
document.getElementById('btn-start-quest').addEventListener('click', () => startQuest(suggestedQuest));
function startSuggestedQuest() {
  if (!suggestedQuest) suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  startQuest(suggestedQuest);
}
```

`renderDailyQuests` ports the existing `refreshQuests` card rendering into `daily-quests-board-container` using `fd-card` markup; keep the `evaluateQuests` logic identical. Keep `awardNewQuestCompletions` and `showXpToast` as they are (toast element id unchanged).

- [ ] **Step 3: The reminder path and snooze**

```javascript
function onReminderFires() {
  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  showTab('today');
  const card = document.getElementById('primary-suggested-card');
  card.classList.remove('quest-pulse');
  void card.offsetWidth; // restart the animation
  card.classList.add('quest-pulse');
  document.getElementById('btn-snooze-quest').classList.remove('hidden');
}

document.getElementById('btn-snooze-quest').addEventListener('click', snoozeReminder);
function snoozeReminder() {
  document.getElementById('btn-snooze-quest').classList.add('hidden');
  if (snoozeTimeout) clearTimeout(snoozeTimeout);
  snoozeTimeout = setTimeout(onReminderFires, 15 * 60 * 1000);
}
```

- [ ] **Step 4: The live quest widget (break flow)**

Rules: one `startTimer` per quest for `quest.duration * 60` seconds; the current step is derived from elapsed time against cumulative step durations; pause stops the timer and remembers remaining seconds; resume starts a fresh `startTimer` with the remainder; skip completes immediately. Sound at each step change and completion, gated by mute.

```javascript
let liveQuest = null, liveRemaining = 0, livePaused = false, liveStepIdx = -1;

function sound(freq, ms) {
  if (!getSettings().muted) playTone(freq, ms);
}

function stepAtElapsed(quest, elapsed) {
  let acc = 0;
  for (let i = 0; i < quest.steps.length; i++) {
    acc += quest.steps[i].duration;
    if (elapsed < acc) return i;
  }
  return quest.steps.length - 1;
}

function startQuest(quest) {
  liveQuest = quest;
  liveStepIdx = -1;
  livePaused = false;
  document.body.classList.add('break-active');
  document.getElementById('btn-snooze-quest').classList.add('hidden');
  document.getElementById('live-quest-widget').classList.remove('hidden');
  runLiveTimer(quest.duration * 60);
}

function runLiveTimer(seconds) {
  if (activeTimer) activeTimer.stop();
  const total = liveQuest.duration * 60;
  activeTimer = startTimer(seconds, (remaining) => {
    liveRemaining = remaining;
    document.getElementById('live-timer-countdown').textContent = formatTime(remaining);
    const CIRC = 377; // 2 * PI * r, r=60 from the svg
    document.getElementById('timer-progress-circle').style.strokeDashoffset =
      String(CIRC * (1 - remaining / total));
    const idx = stepAtElapsed(liveQuest, total - remaining);
    if (idx !== liveStepIdx) { liveStepIdx = idx; renderLiveStep(); if (idx > 0) sound(523, 150); }
  }, completeQuest);
}

function renderLiveStep() {
  const step = liveQuest.steps[liveStepIdx];
  document.getElementById('live-quest-movement-title').textContent = step.title;
  document.getElementById('live-quest-movement-desc').textContent = step.desc;
  const ill = document.getElementById('live-quest-illustration-container');
  ill.innerHTML = getFigure(step.svg);
  ill.className = step.animation || '';
  const dots = document.getElementById('live-quest-dots');
  dots.innerHTML = liveQuest.steps
    .map((_, i) => `<div class="step-dot${i <= liveStepIdx ? ' active' : ''}"></div>`).join('');
}

document.getElementById('btn-live-pause').addEventListener('click', function () {
  if (!liveQuest) return;
  if (!livePaused) { activeTimer.stop(); livePaused = true; this.textContent = 'Resume'; }
  else { livePaused = false; this.textContent = 'Pause'; runLiveTimer(liveRemaining); }
});
document.getElementById('btn-live-skip').addEventListener('click', () => {
  if (!liveQuest) return;
  if (activeTimer) activeTimer.stop();
  completeQuest();
});

function completeQuest() {
  const quest = liveQuest;
  liveQuest = null;
  document.body.classList.remove('break-active');
  document.getElementById('btn-live-pause').textContent = 'Pause';
  sound(659, 300); setTimeout(() => sound(784, 400), 350);

  logBreak(quest.id, quest.targetArea, quest.tier);
  recordDaySummary({ date: todayDateString(), minutes: quest.duration, targetArea: quest.targetArea });
  const result = awardBreak(quest.xp);
  showXpToast(`+${result.xpGained} XP${result.leveledUp ? ` · Level ${result.level}: ${result.title}` : ''}`);
  if (result.leveledUp) setTimeout(() => sound(880, 400), 750);
  awardNewQuestCompletions();

  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  showTab('today');
  updateRail();
  updateTopBar();
}
```

Between quests the widget shows a resting state: on `updateRail()`, if `liveQuest` is null, set the widget title to the next-reminder countdown ("Next quest in 32 min" from `getNextReminderMs`, or "Off the clock" outside the window) and show the suggested quest's first-step figure statically.

- [ ] **Step 5: The rail (XP bar + shield)**

```javascript
function updateRail() {
  const p = getProgress();
  document.getElementById('level-display-label').textContent = `Level ${p.level} · ${p.title}`;
  document.getElementById('xp-display-label').textContent =
    p.xpForNext === null ? `${p.xp} XP · max level` : `${p.xpIntoLevel} / ${p.xpForNext} XP`;
  document.getElementById('xp-progress-fill-bar').style.width =
    p.xpForNext === null ? '100%' : `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;

  const h = getStreak();
  const card = document.getElementById('shield-card');
  const desc = document.getElementById('shield-desc-text');
  card.classList.toggle('shield-inactive', !h.shieldHeld);
  if (h.shieldUsedFor) {
    const weekday = new Date(h.shieldUsedFor + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
    desc.textContent = `Your shield covered ${weekday}. Streak safe.`;
    acknowledgeShieldUse();
  } else {
    desc.textContent = h.shieldHeld
      ? 'Protects your streak for one missed day'
      : 'Earn one with a 5-day streak';
  }
}
```

Refresh Today (sitting line, countdown) every 10 seconds with the pattern of the old `startCountdownDisplay`, calling a light `tickToday()` that updates only `today-seated-timer`, `dashboard-sitting-duration`, `next-break-line`, and the resting rail countdown.

- [ ] **Step 6: Manual check**

Serve locally, complete onboarding, click Start Quest: fullscreen-on-mobile break runs, steps advance with figures, pause/resume/skip work, XP toast fires, streak/XP update. Reroll never repeats the same quest twice in a row.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: Today view, quest break flow with stepped live widget, snooze, rail"
```

---

### Task 9: `app.js` part 3 — library, rewards, progress, settings, top bar

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `getUnlocks()`, `getWeekStats(now)`, `getAreaBalance(now)`, `getStreak()`, `getSettings()/saveSettings()`, `resetAll()`, `isWorkday`.
- Produces: `renderLibrary()`, `renderRewards()`, `renderProgress()`, `renderSettings()`, `updateTopBar()`.

- [ ] **Step 1: Quests library**

```javascript
let libraryFilter = 'all';

function renderLibrary() {
  const grid = document.getElementById('quests-library-container');
  const list = EXERCISES.filter(e => libraryFilter === 'all' || e.category === libraryFilter);
  grid.innerHTML = list.map(e => `
    <div class="fd-card library-card">
      <div class="quest-meta">
        <span class="quest-tag">${e.category} · ${e.tier}</span>
        <h3 class="quest-title-text">${e.name}</h3>
        <p class="quest-desc">${e.desc}</p>
      </div>
      <div class="quest-action-row">
        <span class="xp-indicator">+${e.xp} XP · ${e.duration} min</span>
        <button class="btn-primary" data-start-quest="${e.id}">Start</button>
      </div>
    </div>`).join('');
  grid.querySelectorAll('[data-start-quest]').forEach(btn =>
    btn.addEventListener('click', () => {
      const quest = EXERCISES.find(e => e.id === btn.dataset.startQuest);
      showTab('today');
      startQuest(quest);
    }));
}

document.querySelectorAll('#quests-library-filters .filter-pill').forEach(pill =>
  pill.addEventListener('click', () => {
    libraryFilter = pill.dataset.filter;
    document.querySelectorAll('#quests-library-filters .filter-pill')
      .forEach(p => p.classList.toggle('active', p === pill));
    renderLibrary();
  }));
```

`EXERCISES` must be added to app.js imports.

- [ ] **Step 2: Rewards**

```javascript
function renderRewards() {
  const p = getProgress();
  document.getElementById('rewards-level-val').textContent = p.level;
  document.getElementById('rewards-level-title').textContent = `"${p.title}"`;
  document.getElementById('rewards-unlocks-container').innerHTML = getUnlocks().map(pack => `
    <div class="unlock-item${pack.unlocked ? '' : ' locked'}">
      <div class="unlock-name">${pack.unlocked ? '✅' : '🔒'} ${pack.label}</div>
      <div class="unlock-req">${pack.unlocked
        ? `${pack.quests.length} quests: ${pack.quests.join(', ')}`
        : `Unlocks at level ${pack.level} · ${pack.quests.length} quests inside`}</div>
    </div>`).join('');
}
```

(Confirm `unlock-item` classes exist in the copied CSS; if the example used different class names in `rewards-unlocks-container` injection, match those from the example app.js `renderUnlocks` code.)

- [ ] **Step 3: Progress**

```javascript
function renderProgress() {
  const now = new Date();
  const stats = getWeekStats(now);
  const streak = getStreak();
  document.getElementById('stats-total-resets').textContent = streak.totalBreaks;
  document.getElementById('stats-total-minutes').textContent = `${stats.minutesMoved}m`;
  document.getElementById('stats-current-streak').textContent = stats.streak;

  // Adherence: workdays in the last 7 days with at least one break
  const workDays = getSettings().workDays;
  const wd = stats.days.filter(d => isWorkday(d.date, workDays));
  const adherence = wd.length === 0 ? 0 : Math.round(100 * wd.filter(d => d.count > 0).length / wd.length);
  document.getElementById('stats-adherence').textContent = `${adherence}%`;

  const balance = getAreaBalance(now);
  const active = balance.filter(b => b.count > 0).map(b => b.area);
  for (const { area } of balance) {
    document.getElementById('muscle-' + area)
      .classList.toggle('active-coverage', active.includes(area));
  }
  const label = a => ({ neck: 'Neck', shoulders: 'Shoulders', core: 'Core', wrists: 'Wrists', legs: 'Legs' }[a]);
  document.getElementById('legend-active-areas').textContent =
    active.length ? `Covered this week: ${active.map(label).join(', ')}` : 'Nothing covered yet this week';
  const idle = balance.filter(b => b.count === 0).map(b => label(b.area));
  document.getElementById('legend-focus-areas').textContent =
    idle.length ? `Waiting for attention: ${idle.join(', ')}` : 'Every zone covered. Full-body week.';
}
```

`isWorkday` must be added to the storage.js import line in app.js.

- [ ] **Step 4: Settings**

```javascript
let settingsFixedTimes = [];

function renderSettings() {
  const s = getSettings();
  document.getElementById('settings-name-input').value = s.userName || '';
  document.getElementById('settings-work-start').value = s.workStart;
  document.getElementById('settings-work-end').value = s.workEnd;
  for (let d = 0; d < 7; d++)
    document.getElementById('settings-wd-' + d).checked = (s.workDays || [1,2,3,4,5]).includes(d);
  document.getElementById('settings-reminder-mode').value = s.reminderMode;
  document.getElementById('settings-interval-minutes').value = String(s.intervalMinutes);
  document.getElementById('settings-sound-toggle').checked = !s.muted;
  settingsFixedTimes = [];
  const list = document.getElementById('settings-fixed-times-list');
  list.innerHTML = '';
  (s.fixedTimes || []).forEach(t => addTimeChip(t, list, settingsFixedTimes));
  toggleReminderInputs(s.reminderMode);
}

function toggleReminderInputs(mode) {
  document.getElementById('settings-interval-minutes').classList.toggle('hidden', mode === 'fixed');
  document.getElementById('settings-fixed-options').classList.toggle('hidden', mode === 'interval');
}
document.getElementById('settings-reminder-mode').addEventListener('change', function () { toggleReminderInputs(this.value); });
document.getElementById('settings-add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('settings-fixed-time-input');
  addTimeChip(input.value, document.getElementById('settings-fixed-times-list'), settingsFixedTimes);
  input.value = '';
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
  saveSettings({
    userName: document.getElementById('settings-name-input').value.trim(),
    workStart: document.getElementById('settings-work-start').value,
    workEnd: document.getElementById('settings-work-end').value,
    workDays: [0,1,2,3,4,5,6].filter(d => document.getElementById('settings-wd-' + d).checked),
    reminderMode: document.getElementById('settings-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('settings-interval-minutes').value, 10),
    fixedTimes: [...settingsFixedTimes],
    muted: !document.getElementById('settings-sound-toggle').checked
  });
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(onReminderFires);
  showXpToast('Settings saved');
  updateTopBar();
  showTab('today');
});

document.getElementById('btn-reset-database').addEventListener('click', () => {
  if (window.confirm('Reset all data? This deletes your streak, XP, and history on this device. There is no undo.')) {
    resetAll();
    window.location.reload();
  }
});
```

- [ ] **Step 5: Top bar and sidebar identity**

```javascript
function updateTopBar() {
  const s = getSettings();
  const streak = getStreak().streak;
  document.getElementById('streak-counter-value').textContent =
    streak === 1 ? '1 day streak' : `${streak} day streak`;
  document.getElementById('audio-icon-muted').style.display = s.muted ? '' : 'none';
  document.getElementById('audio-icon-unmuted').style.display = s.muted ? 'none' : '';
  const name = s.userName || 'You';
  document.getElementById('sidebar-username').textContent = name;
  document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('sidebar-level-title').textContent = getProgress().title;
}

document.getElementById('audio-mute-btn').addEventListener('click', () => {
  const s = getSettings();
  saveSettings({ ...s, muted: !s.muted });
  updateTopBar();
});
```

- [ ] **Step 6: Service worker message handling (in-page side)**

Replace the old message listener:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'START_SUGGESTED') startSuggestedQuest();
    if (data.type === 'SNOOZE') snoozeReminder();
    if (data.type === 'SHOW_CHOICE') onReminderFires();
  });
}
```

- [ ] **Step 7: Manual check + delete dead code**

Search app.js for remaining references to removed things: `TIER_DURATION`, `TIER_XP`, `TIER_BUTTON_LABELS`, `pendingByTier`, `startTierBreak`, `triggerBreak`, `launchTimer`, `openSettingsModal`, `defaultBreakLength`, old ids (`btn-tier-`, `s-work-start`, `view-dashboard`, `view-timer`). Delete all of it. Serve and walk every tab.

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "feat: library, rewards, progress body map, settings, top bar wiring"
```

---

### Task 10: Service worker (`service-worker.js`, `manifest.json`)

**Files:**
- Modify: `service-worker.js`, `manifest.json`

**Interfaces:**
- Consumes: page-side handlers `START_SUGGESTED` / `SNOOZE` from Task 9.
- Produces: cache `wfh-movement-v8` including `figures.js`; notification with Start quest / Later actions.

- [ ] **Step 1: Update the worker**

Cache name to `'wfh-movement-v8'`; add `'/figures.js'` to ASSETS. Replace the notification body and actions:

```javascript
self.registration.showNotification('Time to move', {
  body: 'Your next quest is ready. Two minutes buys back an hour of sitting.',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-192.png',
  tag: 'wfh-movement-break',
  renotify: true,
  data: { url: '/' },
  actions: [
    { action: 'start', title: 'Start quest' },
    { action: 'later', title: 'Later' }
  ]
});
```

And the click handler:

```javascript
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list[0];
      if (client) {
        client.focus();
        if (action === 'start') client.postMessage({ type: 'START_SUGGESTED' });
        else if (action === 'later') client.postMessage({ type: 'SNOOZE' });
        else client.postMessage({ type: 'SHOW_CHOICE' });
        return;
      }
      if (action === 'later') return;
      return clients.openWindow(action === 'start' ? '/?break=start' : '/');
    })
  );
});
```

- [ ] **Step 2: Manifest check**

Verify `manifest.json` `theme_color` matches `#2E7D67` and name/short_name still read `WFH Movement`. Update `theme_color` if it still holds the old teal.

- [ ] **Step 3: Run reminder tests, commit**

Run: `node tests/reminder.test.js`
Expected: PASS (module untouched; this catches accidental edits).

```bash
git add service-worker.js manifest.json
git commit -m "feat: v8 cache, quest-based notification actions"
```

---

### Task 11: Voice copy pass

**Files:**
- Modify: `index.html`, `app.js` (strings only)

**Interfaces:**
- Consumes: every user-facing string shipped in Tasks 5–10.
- Produces: copy in Mike's voice. Rules: no em dashes anywhere; sentences over fragments; direct and encouraging; matter-of-fact science; warm about the human; never hype ("crush it") and never clinical-cold ("verify your structural health trends").

- [ ] **Step 1: Sweep `index.html`**

Read every visible string. Known offenders from the example and their direction (rewrite in voice, these are targets not templates):
- "Select and swap individual movements or packs targeted for desk-safe exercise." → "Every movement in the library. Pick one, start it, feel better in minutes."
- "Verify your structural health trends..." (Progress subtitle) → "Your week at a glance. Frequency is the win, not intensity."
- "Tune the WFH Movement companion parameters..." → already replaced in Task 5.
- "Level up through consistent desk wellness and unlock..." (Rewards subtitle) → "Show up, level up. Packs open as you go."
- Any remaining "resets" as a noun for breaks → "breaks" or "quests" consistently. Pick "quest" for the gamified surfaces (Today, Rewards) and "break" for the science/education copy.

- [ ] **Step 2: Sweep `app.js` strings**

Greeting lines, toast copy, countdown labels, the eight POSITIVE_QUOTES (edit any that read like a fortune cookie; keep the sentiment, sharpen the sentence), notification copy already set in Task 10.

- [ ] **Step 3: The em dash check**

Run: `Select-String -Path index.html,app.js -Pattern ([char]0x2014)`
Expected: no matches in user-facing strings.

- [ ] **Step 4: Commit**

```bash
git add index.html app.js
git commit -m "chore: copy pass -- every user-facing string in house voice"
```

---

### Task 12: Full verification, cleanup, ship gate

**Files:**
- Delete: `Frontendexampleantigravity/`, `illustrations/`, `tools/port-antigravity.mjs`

- [ ] **Step 1: Run every test file**

Run each: `node tests/exercises.test.js`, `figures`, `game`, `insights`, `quests`, `rotation`, `storage`, `reminder`, `timer`.
Expected: all PASS, zero failures.

- [ ] **Step 2: Manual walkthrough (desktop)**

Serve locally with cleared site data: landing → wizard (all four slides, back/next, fixed-times mode) → Today. Start quest → steps advance with figures and dots → completion toast → stats update. Reroll excludes current. Snooze appears only after a reminder. Every tab renders. Settings round-trip: rename, change hours, switch to fixed times, save, verify greeting and countdown change. Mute silences tones. Reset returns to landing.

- [ ] **Step 3: Manual walkthrough (phone width)**

At 375px: sidebar is a bottom tab bar, no horizontal scroll, active break takes the full screen and returns cleanly.

- [ ] **Step 4: Returning-user migration check**

In the browser console, seed old-shape state before loading:
`localStorage.setItem('wfh-movement', JSON.stringify({settings:{workStart:'09:00',workEnd:'17:00',reminderMode:'interval',intervalMinutes:45,fixedTimes:[],defaultBreakLength:'full'},history:{streak:3,totalBreaks:12,lastActiveDate:'2026-07-02'},game:{xp:180},dayLog:{'2026-07-01':{count:2,minutes:4,areas:{hips:1,spine:1}}}}))`
Reload: no landing, streak 3 shows, level 2 shows, Progress maps old areas into legs/core, greeting is nameless until Settings adds a name.

- [ ] **Step 5: Cleanup commit**

```bash
git rm -r Frontendexampleantigravity illustrations tools
git commit -m "chore: remove merged reference example, retired illustrations, port script"
```

- [ ] **Step 6: Ship gate (do NOT merge without it)**

Push the branch (`git push -u origin ui-overhaul`) so Netlify builds a branch preview if configured, or demo the local preview. Mike clicks through on desktop and phone. Only after his explicit approval: merge `ui-overhaul` to `main` and push. Then delete the stale duplicate repo at `D:\Downloads\Git\bin` (separate housekeeping, ask first).
