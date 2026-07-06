# Stiffness Scan v2 + Body Defense Coaching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the binary on-demand scan with an always-on Active Body Stiffness Scan (5 zones × None/Mild/Tight) that drives an adaptive coaching engine — recommending the tightest zone's quest, flagging it "Critical Body Defense," and filling a Body Defense Insights panel — while renaming the `core` zone to `back`.

**Architecture:** A new pure `coaching.js` module holds the zone-selection + copy logic (unit-tested). `storage.js` gains a per-day `bodyStiffness` severity map. `app.js` renders the scan chips and wires taps → save → recompute. The `core`→`back` rename lands atomically across the data layer, tests, and the Progress body-map. Quest selection reuses the existing `suggestExercise(..., preferredAreas)` picker.

**Tech Stack:** Vanilla ES modules, no build step, no dependencies. Tests are plain Node assert scripts run with `node tests/<name>.test.js`.

## Global Constraints

- No new dependencies, no build tooling. Plain ES modules loaded by `index.html`.
- The five zones are exactly: `neck, shoulders, back, wrists, legs`. There is NO `core` zone after this work.
- Severity levels: `0` None, `1` Mild, `2` Tight. Tight outranks Mild; tie-break order `neck → shoulders → back → wrists → legs`.
- "Critical Body Defense" badge is visual only — no XP bonus.
- Tests use the existing harness: `import { test, run } from './run.js'`, mock `localStorage` for storage-touching tests, end the file with `run()`. Run with `node tests/<name>.test.js`.
- Coaching copy and component CSS are verbatim from the spec (`docs/superpowers/specs/2026-07-06-stiffness-scan-v2-coaching-design.md`, Appendices A & B). Do not reword.
- Audience adults 60+: tap-only.

---

### Task 1: Rename `core` → `back` across the data layer + body-map

Atomic rename. The Progress body-map DOM must change in the same task or `renderProgress` throws (`getElementById('muscle-back')` would be null while `getAreaBalance` returns `back`).

**Files:**
- Modify: `exercises.js` (6 `targetArea` values), `insights.js:4-5`, `quests.js:19-20,45`, `app.js:137`, `index.html:307,321,324`
- Test: `tests/exercises.test.js`, `tests/insights.test.js`, `tests/quests.test.js`, `tests/rotation.test.js`

**Interfaces:**
- Produces: the targetArea/zone key `back` (replacing `core`) everywhere. `insights.js` normalizes legacy `core` → `back` on read.

- [ ] **Step 1: Update the tests first (they encode the rename)**

In `tests/exercises.test.js`: change the AREAS set `'core'` → `'back'`, and in the id→area map change every `'core'` value to `'back'` (`back-twist`, `seated-plank`, `deep-breaths`, `seated-spinal-twist`, `side-bends`, `desk-plank`).

In `tests/insights.test.js`: the legacy test currently named `'legacy areas map on read: hips->legs, spine->core'` — change its expectation so `spine` maps to `back` (and `get('back')` is checked instead of `get('core')`).

In `tests/quests.test.js`: `EASY_IDS` array `'core'` → `'back'`.

In `tests/rotation.test.js`: every sample `targetArea: 'core'` → `'back'`; the calls `suggestExercise('core', ...)` → `suggestExercise('back', ...)`; the assertion message/area `'Should avoid core area'` and `result.targetArea !== 'core'` → `'back'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/exercises.test.js` and `node tests/insights.test.js`
Expected: FAIL — production still uses `core`.

- [ ] **Step 3: Rename in exercises.js**

In `exercises.js`, change all six occurrences of `"targetArea": "core"` to `"targetArea": "back"` (lines 84, 143, 228, 254, 415, 607). Leave `name`/`desc` text (e.g. "Core Engagement") unchanged.

- [ ] **Step 4: Rename in insights.js**

`insights.js:4-5`, replace with:

```js
const AREAS = ['neck', 'shoulders', 'back', 'wrists', 'legs'];
const LEGACY_AREAS = { hips: 'legs', spine: 'back', cardio: 'legs', core: 'back' };
```

- [ ] **Step 5: Rename in quests.js**

`quests.js:19-20`, replace with:

```js
  { id: 'back', title: 'Straighten the desk slump', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'back') },
```

`quests.js:45`, in the `EASY_SATISFIABLE` set change `'core'` to `'back'`:

```js
const EASY_SATISFIABLE = new Set(['take-2', 'wrists', 'neck', 'legs', 'back', 'easy-tier', 'early-mover', 'strong-finish']);
```

- [ ] **Step 6: Rename the body-map (app.js + index.html)**

`app.js:137`, replace the label map:

```js
  const label = a => ({ neck: 'Neck', shoulders: 'Shoulders', back: 'Back', wrists: 'Wrists', legs: 'Legs' }[a]);
```

`index.html:307`, change the id:

```html
                                        <path class="body-muscle" id="muscle-back" d="M36,58 L64,58 L60,95 L40,95 Z"></path>
```

`index.html:321`, update the placeholder legend text `Core, Lower Body` → `Back, Lower Body`. `index.html:324`, change `...your lower body and core.` → `...your lower body and back.`

- [ ] **Step 7: Run the full suite**

Run: every `node tests/*.test.js`
Expected: all PASS. No `core` zone remains.

- [ ] **Step 8: Commit**

```bash
git add exercises.js insights.js quests.js app.js index.html tests/
git commit -m "refactor: rename core body zone to back"
```

---

### Task 2: `coaching.js` engine

**Files:**
- Create: `coaching.js`
- Test: `tests/coaching.test.js`

**Interfaces:**
- Produces:
  - `tightestZone(bodyStiffness)` → zone key with highest level, tie-break `neck → shoulders → back → wrists → legs`; `null` if all `0`/missing.
  - `preferredAreasFrom(bodyStiffness)` → array of zone keys with level `> 0`, in tie-break order; `[]` if none.
  - `coachingFor(zone)` → `{ headline, body, bullets: [{text, critical}] }`; generic copy when `zone` is `null`/unknown.

- [ ] **Step 1: Write the failing tests**

Create `tests/coaching.test.js`:

```js
import { test, run } from './run.js';
import { tightestZone, preferredAreasFrom, coachingFor } from '../coaching.js';

test('tightestZone returns null when nothing logged', () => {
  if (tightestZone({ neck: 0, shoulders: 0, back: 0, wrists: 0, legs: 0 }) !== null)
    throw new Error('expected null');
  if (tightestZone(undefined) !== null) throw new Error('expected null for undefined');
});

test('tightestZone: a single Tight outranks any number of Mild', () => {
  const z = tightestZone({ neck: 1, shoulders: 1, back: 0, wrists: 2, legs: 1 });
  if (z !== 'wrists') throw new Error(`expected wrists, got ${z}`);
});

test('tightestZone tie-break favors earlier in order', () => {
  const z = tightestZone({ neck: 0, shoulders: 2, back: 2, wrists: 0, legs: 0 });
  if (z !== 'shoulders') throw new Error(`expected shoulders, got ${z}`);
});

test('preferredAreasFrom returns only non-zero zones, in order', () => {
  const p = preferredAreasFrom({ neck: 0, shoulders: 1, back: 0, wrists: 2, legs: 0 });
  if (p.join(',') !== 'shoulders,wrists') throw new Error(`got ${p}`);
  if (preferredAreasFrom({ neck: 0, shoulders: 0, back: 0, wrists: 0, legs: 0 }).length !== 0)
    throw new Error('expected empty');
});

test('coachingFor returns the zone headline, or generic for null', () => {
  if (coachingFor('back').headline !== 'Coaching Focus: Thoracic Spinal Twist')
    throw new Error('wrong back headline');
  if (coachingFor(null).headline !== 'Coaching Focus: Posture Recovery')
    throw new Error('wrong generic headline');
  if (coachingFor(null).bullets[0].critical !== false)
    throw new Error('generic bullets are non-critical');
});

run();
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/coaching.test.js`
Expected: FAIL — `coaching.js` does not exist.

- [ ] **Step 3: Create `coaching.js`**

```js
// coaching.js -- adaptive stiffness coaching: pick the tightest zone and its copy.
const TIE_ORDER = ['neck', 'shoulders', 'back', 'wrists', 'legs'];

export function tightestZone(bodyStiffness) {
  const s = bodyStiffness || {};
  let zone = null, max = 0;
  for (const key of TIE_ORDER) {
    const v = s[key] || 0;
    if (v > max) { max = v; zone = key; }
  }
  return zone;
}

export function preferredAreasFrom(bodyStiffness) {
  const s = bodyStiffness || {};
  return TIE_ORDER.filter(k => (s[k] || 0) > 0);
}

const COACHING = {
  neck: {
    headline: 'Coaching Focus: Cervical Spine Reset',
    body: 'Neck tightness logged. Performing neck stretches and retractions helps prevent nerve compression and strain.',
    bullets: [
      { text: 'Make sure your computer screen is at eye level to prevent neck strain.', critical: true },
      { text: 'Retracting your chin gently resets cervical alignment and reduces shoulder load.', critical: true }
    ]
  },
  shoulders: {
    headline: 'Coaching Focus: Chest & Shoulder Opening',
    body: 'Shoulder strain logged. Engaging chest and shoulder opening stretches to counter slouched posture.',
    bullets: [
      { text: 'Keep your shoulders pulled down and back while you sit to maintain scapular activation.', critical: true },
      { text: 'Doorway stretches open the front body and release respiratory restrictions.', critical: true }
    ]
  },
  back: {
    headline: 'Coaching Focus: Thoracic Spinal Twist',
    body: 'Lumbar pressure logged. Activating rotational extensions hydrates spinal discs to prevent bulging.',
    bullets: [
      { text: 'Use a lumbar support cushion or a rolled-up towel behind your lower back to maintain proper posture.', critical: true },
      { text: 'Rotational spine movement unloads deep back stabilizers and improves ribcage expansion.', critical: true }
    ]
  },
  wrists: {
    headline: 'Coaching Focus: Extremity Tendon Stretch',
    body: 'Wrist fatigue or finger numbness logged. Extending wrist flexors offsets sustained typing shear stress.',
    bullets: [
      { text: 'Keep frequently used items within easy reach on your desk to avoid excessive reaching and twisting.', critical: true },
      { text: 'Stretching your wrist back pulls on tight tendons, preventing carpal channel pressure build-up.', critical: true }
    ]
  },
  legs: {
    headline: 'Coaching Focus: Posterior Chain & Vascular Activation',
    body: 'Leg swelling, fluid build-up, or glute weakness logged. Activating glutes and moving spikes lower extremity circulation.',
    bullets: [
      { text: 'Take a brief activity break to stand up every 30 to 45 minutes to refresh circulation.', critical: true },
      { text: 'Cardio bursts contract major muscle pumps, forcing pooled blood out of the legs.', critical: true }
    ]
  }
};

const GENERIC = {
  headline: 'Coaching Focus: Posture Recovery',
  body: 'No active stiffness logged. Proposing standard mobility flows to protect your body against silent strain build-up.',
  bullets: [
    { text: 'Prolonged sitting triggers hidden posture stress even when you feel fine.', critical: false },
    { text: 'Every 45 minutes of keyboard use should be met with 3 minutes of shoulder extensions.', critical: false }
  ]
};

export function coachingFor(zone) {
  return COACHING[zone] || GENERIC;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node tests/coaching.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add coaching.js tests/coaching.test.js
git commit -m "feat: coaching.js stiffness-to-recommendation engine"
```

---

### Task 3: `bodyStiffness` on the today record

**Files:**
- Modify: `storage.js:48-55` (today-record default), plus replace the `saveStiffAreas` export
- Test: `tests/stiffness-storage.test.js` (rewrite — replaces the v1 stiffAreas test)

**Interfaces:**
- Consumes: `getState`, `saveState`, `getTodayRecord`.
- Produces:
  - `getTodayRecord()` returns `bodyStiffness: { neck:0, shoulders:0, back:0, wrists:0, legs:0 }` on a fresh day (no more `stiffAreas`).
  - `saveBodyStiffness(zone, level)` — sets one zone's level on today's record.

- [ ] **Step 1: Rewrite the failing tests**

Replace the contents of `tests/stiffness-storage.test.js` with:

```js
import { test, run } from './run.js';
import { resetAll, getTodayRecord, saveBodyStiffness } from '../storage.js';

const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

test('fresh today record has all-zero bodyStiffness for the five zones', () => {
  resetAll();
  const b = getTodayRecord().bodyStiffness;
  const keys = ['neck', 'shoulders', 'back', 'wrists', 'legs'];
  for (const k of keys) if (b[k] !== 0) throw new Error(`expected ${k}=0`);
  if (Object.keys(b).length !== 5) throw new Error('expected exactly 5 zones');
});

test('saveBodyStiffness sets one zone level and persists', () => {
  resetAll();
  saveBodyStiffness('back', 2);
  saveBodyStiffness('neck', 1);
  const b = getTodayRecord().bodyStiffness;
  if (b.back !== 2 || b.neck !== 1 || b.legs !== 0)
    throw new Error(`unexpected: ${JSON.stringify(b)}`);
});

run();
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/stiffness-storage.test.js`
Expected: FAIL — `saveBodyStiffness` not exported; fresh record has `stiffAreas`, not `bodyStiffness`.

- [ ] **Step 3: Update `storage.js`**

`storage.js:52`, change the fresh return to:

```js
    return { date: today, completedBreaks: [], lastTargetArea: null, bodyStiffness: { neck: 0, shoulders: 0, back: 0, wrists: 0, legs: 0 } };
```

Replace the entire `saveStiffAreas` function with:

```js
export function saveBodyStiffness(zone, level) {
  const state = getState() ?? {};
  const today = getTodayRecord();
  today.bodyStiffness = { ...(today.bodyStiffness || {}), [zone]: level };
  saveState({ ...state, today });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node tests/stiffness-storage.test.js`
Expected: PASS (2 tests). (Other suites that don't import `app.js` still pass; `app.js` is updated in Task 5.)

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/stiffness-storage.test.js
git commit -m "feat: bodyStiffness severity map on today record"
```

---

### Task 4: Component CSS

**Files:**
- Modify: `style.css` (append component rules near the other card/button rules, e.g. after the `.scan-*` rules added in v1 — which you will also delete here since the v1 scan markup is removed in Task 5)

- [ ] **Step 1: Remove the v1 scan CSS and add the v2 component CSS**

In `style.css`, delete the four v1 rules (`.scan-panel`, `.scan-zones`, `.scan-zone`, `.scan-zone.selected`) added for the old scan, and add verbatim:

```css
.stiffness-chip-row { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); flex-grow: 1; }
.stiffness-chip-label { font-size: 12px; font-weight: 600; min-width: 80px; color: rgba(255,255,255,0.9); }
.stiffness-btn-group { display: flex; gap: 4px; }
.stiffness-btn { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; }
.stiffness-btn:hover { background: rgba(255,255,255,0.1); color: #FFFFFF; }
.stiffness-btn.active-none { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #FFFFFF; }
.stiffness-btn.active-mild { background: var(--amber); border-color: var(--amber); color: var(--navy); }
.stiffness-btn.active-tight { background: var(--coral); border-color: var(--coral); color: #FFFFFF; box-shadow: 0 0 8px rgba(243,107,84,0.4); }
.coach-bullet { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; }
.coach-bullet-dot { margin-top: 5px; width: 6px; height: 6px; border-radius: 50%; background-color: var(--coral); flex-shrink: 0; }
.coach-bullet-dot.normal { background-color: var(--primary); }
.coach-bullet-text { line-height: 1.4; }
.quest-critical-badge { background-color: var(--coral-light); color: var(--coral); font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(243,107,84,0.2); text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px; display: inline-block; }
```

- [ ] **Step 2: Sanity check the CSS parses**

Run: `node -e "const c=require('fs').readFileSync('style.css','utf8'); const o=(c.match(/{/g)||[]).length, cl=(c.match(/}/g)||[]).length; if(o!==cl) throw new Error('brace mismatch '+o+' vs '+cl); console.log('braces balanced', o);"`
Expected: `braces balanced <n>`

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: stiffness chip + coach bullet + critical badge styles"
```

---

### Task 5: Scan card, coaching wiring, insights panel (index.html + app.js)

DOM integration. The logic it calls (`coaching.js`, `saveBodyStiffness`, `suggestExercise`) is unit-tested in Tasks 2-3. Verify this task in the browser.

**Files:**
- Modify: `index.html` (replace the v1 scan card at lines 152-166; relabel the recommendation card; add the Body Defense Insights panel at the end of `#view-today`)
- Modify: `app.js` (imports; replace the v1 scan handlers at 312-331; update `renderPrimaryQuest`; add `renderStiffnessCheckGroup` + `recalcCoaching`; update `renderToday`; update the 7 `suggestExercise` call sites)

**Interfaces:**
- Consumes: `tightestZone`, `preferredAreasFrom`, `coachingFor` (Task 2); `saveBodyStiffness`, `getTodayRecord().bodyStiffness` (Task 3); existing `suggestExercise`, `playTone`, `renderPrimaryQuest`, `suggestedQuest`.

- [ ] **Step 1: Replace the scan card markup**

In `index.html`, replace the v1 scan block (lines 152-166, `<!-- Stiffness scan -->` … its closing `</div>`) with:

```html
                        <!-- Active Body Stiffness Scan -->
                        <div class="fd-card sitting-status-card" id="stiffness-scan-card" style="background-color: var(--navy); color:#FFFFFF; flex-direction: column; align-items: stretch; gap: 16px; padding: 20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                <div class="sitting-status-left">
                                    <div class="sitting-title">Active Body Stiffness Scan</div>
                                    <div class="sitting-timer" style="font-size:18px; font-weight:600; margin-top:2px;">Check current posture tightness zones</div>
                                </div>
                                <div class="sitting-badge" style="background-color: var(--coral-light); border-color: var(--coral); color:#FF8F7A;">Live Coaching Active</div>
                            </div>
                            <div style="display:flex; flex-wrap:wrap; gap:8px; width:100%;" id="stiffness-check-group"></div>
                        </div>
```

- [ ] **Step 2: Relabel the recommendation card**

In `index.html`, in the primary quest card: change the `quest-tag` text `Up next` to `Adherence recommendation`, and the insight title `Why this one helps` to `Why this reset helps`.

- [ ] **Step 3: Add the Body Defense Insights panel**

In `index.html`, inside `#view-today`, immediately after the `quests-board-section` div (the "Today's Daily Quests" grid) and before `#view-today` closes, insert:

```html
                        <!-- Body Defense Insights -->
                        <div class="timeline-container">
                            <h3 class="rail-section-title">Body Defense Insights & Recommendations</h3>
                            <div class="fd-card" style="display:flex; flex-direction:column; gap:16px;">
                                <div style="display:flex; align-items:center; gap:16px;">
                                    <div style="font-size:36px; background-color: var(--primary-light); width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center;">🧠</div>
                                    <div>
                                        <h4 style="font-weight:600; font-size:14.5px; color: var(--primary);" id="coach-insight-headline">Coaching Focus: Posture Recovery</h4>
                                        <p style="color:var(--text-muted); font-size:12.5px; margin-top:2px;" id="coach-insight-body">No active stiffness logged. Proposing standard mobility flows to protect your body against silent strain build-up.</p>
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--border-color); padding-top:14px;" id="coach-defense-bullets"></div>
                            </div>
                        </div>
```

- [ ] **Step 4: Update app.js imports**

`app.js:3`, add `saveBodyStiffness` to the storage import and remove `saveStiffAreas`. Add a new import line after the rotation import (line 4):

```js
import { tightestZone, preferredAreasFrom, coachingFor } from './coaching.js';
```

- [ ] **Step 5: Update `renderPrimaryQuest` to show the critical badge**

Replace `renderPrimaryQuest` (app.js:283-289) with:

```js
function renderPrimaryQuest() {
  const critical = tightestZone(getTodayRecord().bodyStiffness) !== null;
  document.getElementById('primary-quest-title').innerHTML = critical
    ? `${suggestedQuest.name} <span class="quest-critical-badge">Critical Body Defense</span>`
    : suggestedQuest.name;
  document.getElementById('primary-quest-description').textContent = suggestedQuest.desc;
  document.getElementById('primary-quest-time').textContent = `${suggestedQuest.duration} min`;
  document.getElementById('primary-quest-xp').textContent = `+${suggestedQuest.xp} XP`;
  document.getElementById('primary-quest-insight').textContent = suggestedQuest.desc;
}
```

(`suggestedQuest.name` comes from the exercise library, not user input — `innerHTML` is safe here.)

- [ ] **Step 6: Replace the v1 scan handlers with the scan renderer + coaching**

Replace the v1 scan block (app.js:312-331, `// Stiffness scan` through its closing `});`) with:

```js
// Active Body Stiffness Scan + adaptive coaching
const STIFF_PARTS = [
  { key: 'neck', label: '🦒 Neck' },
  { key: 'shoulders', label: '🤷 Shoulders' },
  { key: 'back', label: '🧘 Back' },
  { key: 'wrists', label: '🖐️ Wrists' },
  { key: 'legs', label: '🦵 Legs' }
];
const STIFF_LEVELS = [
  { val: 0, label: 'None', cls: 'active-none' },
  { val: 1, label: 'Mild', cls: 'active-mild' },
  { val: 2, label: 'Tight', cls: 'active-tight' }
];

function renderStiffnessCheckGroup() {
  const container = document.getElementById('stiffness-check-group');
  if (!container) return;
  const stiffness = getTodayRecord().bodyStiffness || {};
  container.innerHTML = '';
  for (const part of STIFF_PARTS) {
    const current = stiffness[part.key] || 0;
    const row = document.createElement('div');
    row.className = 'stiffness-chip-row';
    const label = document.createElement('span');
    label.className = 'stiffness-chip-label';
    label.textContent = part.label;
    const group = document.createElement('div');
    group.className = 'stiffness-btn-group';
    for (const lvl of STIFF_LEVELS) {
      const btn = document.createElement('button');
      btn.className = 'stiffness-btn' + (current === lvl.val ? ' ' + lvl.cls : '');
      btn.textContent = lvl.label;
      btn.addEventListener('click', () => {
        saveBodyStiffness(part.key, lvl.val);
        renderStiffnessCheckGroup();
        recalcCoaching();
        playTone('next');
      });
      group.appendChild(btn);
    }
    row.appendChild(label);
    row.appendChild(group);
    container.appendChild(row);
  }
}

function recalcCoaching() {
  const record = getTodayRecord();
  suggestedQuest = suggestExercise(record.lastTargetArea, null, null, preferredAreasFrom(record.bodyStiffness));
  renderPrimaryQuest();
  const coaching = coachingFor(tightestZone(record.bodyStiffness));
  const head = document.getElementById('coach-insight-headline');
  const body = document.getElementById('coach-insight-body');
  const bullets = document.getElementById('coach-defense-bullets');
  if (head) head.textContent = coaching.headline;
  if (body) body.textContent = coaching.body;
  if (bullets) {
    bullets.innerHTML = '';
    for (const b of coaching.bullets) {
      const div = document.createElement('div');
      div.className = 'coach-bullet';
      const dot = document.createElement('span');
      dot.className = 'coach-bullet-dot' + (b.critical ? '' : ' normal');
      const text = document.createElement('span');
      text.className = 'coach-bullet-text';
      text.textContent = b.text;
      div.appendChild(dot);
      div.appendChild(text);
      bullets.appendChild(div);
    }
  }
}
```

- [ ] **Step 7: Wire the scan into `renderToday`**

In `renderToday` (app.js), replace the line `if (!suggestedQuest) suggestedQuest = suggestExercise(record.lastTargetArea, null, null, record.stiffAreas);` (line 276) and the following `renderPrimaryQuest();` call with:

```js
  renderStiffnessCheckGroup();
  recalcCoaching();
```

(`recalcCoaching` sets `suggestedQuest` and calls `renderPrimaryQuest`, so the standalone call is no longer needed.)

- [ ] **Step 8: Update the remaining `suggestExercise` call sites**

Grep `suggestExercise(` in `app.js`. For every remaining call that passed `getTodayRecord().stiffAreas` (the reroll handler ~302, `startSuggestedQuest` ~308, `onReminderFires` ~317/338, and the resume/other sites ~424, ~443, ~464), replace the 4th argument `getTodayRecord().stiffAreas` (or `record.stiffAreas`) with `preferredAreasFrom(getTodayRecord().bodyStiffness)`. There must be no remaining reference to `stiffAreas` or `saveStiffAreas` in `app.js` after this step — grep to confirm both return nothing.

- [ ] **Step 9: Static self-check**

Confirm: every DOM id used in the new app.js code (`stiffness-check-group`, `coach-insight-headline`, `coach-insight-body`, `coach-defense-bullets`, `primary-quest-title/description/time/xp/insight`) exists in `index.html`. Confirm `grep -n "stiffAreas\|saveStiffAreas\|btn-open-scan\|btn-scan-done\|scan-panel\|scan-zone" app.js index.html` returns nothing.

- [ ] **Step 10: Run the full suite (parse/regression guard)**

Run: every `node tests/*.test.js`
Expected: all PASS (app.js changes don't break the unit suite, which doesn't import app.js; this confirms the modules app.js imports still export what it needs).

- [ ] **Step 11: Commit**

```bash
git add index.html app.js
git commit -m "feat: active stiffness scan + body defense coaching on Today"
```

---

### Task 6: Ship — service worker cache

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Bump cache and add coaching.js**

In `service-worker.js`: change the cache name `wfh-movement-v10` → `wfh-movement-v11`, and add `'/coaching.js'` to the `ASSETS` array (next to `'/rotation.js'`).

- [ ] **Step 2: Verify precache list**

Confirm `ASSETS` includes `/index.html`, `/app.js`, `/coaching.js`, `/rotation.js`, `/storage.js`, `/insights.js`, `/quests.js`, `/exercises.js`, `/style.css`. Add any missing.

- [ ] **Step 3: Run the full suite**

Run: every `node tests/*.test.js`
Expected: all PASS (including `coaching.test.js` and the rewritten `stiffness-storage.test.js`).

- [ ] **Step 4: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump service worker cache v10 -> v11 for stiffness scan v2"
```

---

## Self-Review

- **Spec coverage:** §1 data → Task 3. §2 engine → Task 2. §3 scan card → Task 5 Steps 1,6-7. §4 recommendation + insights → Task 5 Steps 2-3,5-6. §5 wiring (7 call sites) → Task 5 Step 8. §6 styling → Task 4. §7 testing → Tasks 2-3 unit + Task 5 browser. §8 ship → Task 6. §9 rename → Task 1. All covered.
- **Placeholder scan:** none — every code step carries complete code.
- **Type consistency:** `bodyStiffness` object shape, `saveBodyStiffness(zone, level)`, `tightestZone`/`preferredAreasFrom`/`coachingFor`, and the zone key `back` are used identically across tasks. `preferredAreasFrom` feeds `suggestExercise`'s existing 4th param.
- **Ordering note:** Task 3 removes `saveStiffAreas`/`stiffAreas` while `app.js` still references them; the unit suite stays green (it doesn't import `app.js`), and Task 5 removes those references. The app is only browser-verified after Task 5, so no broken intermediate is shipped.
