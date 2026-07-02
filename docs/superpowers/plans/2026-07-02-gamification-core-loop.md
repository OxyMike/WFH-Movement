# Gamification Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three-tier break choice (Easy/Medium/Hard) with one-tap-to-timer, XP and ten titled levels, reward card, buff-framed copy, and notification action buttons.

**Architecture:** New `game.js` owns all gamification math and copy, persisting XP via storage.js's existing getState/saveState (storage.js itself unchanged). `exercises.js` gains a `tier` field and 8 hard exercises; `rotation.js` gains a tier filter. app.js/index.html swap the exercise prompt for a choice card and upgrade the completion flash to a reward card. Service worker adds notification actions and bumps cache.

**Tech Stack:** HTML5, CSS custom properties, vanilla ES modules, existing zero-dependency test runner (run each `tests/*.test.js` with `node --experimental-vm-modules`).

## Global Constraints

- Working directory: `D:\ClaudeProjects\wfh-movement`.
- Frozen files: `timer.js`, `storage.js`, `reminder.js` must not change. (`exercises.js` and `rotation.js` are deliberately amended by this plan.)
- No punishment mechanics: no XP decay, caps, guilt copy, or red failure states. Skip pays nothing and says nothing.
- No em dashes in any copy. Voice: warm, conversational, encouraging.
- XP per tier exactly: easy 10, medium 20, hard 35. Durations exactly: easy 60 s, medium 120 s, hard 180 s.
- Level thresholds exactly: 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200.
- Titles exactly, levels 1-10: Chair Dweller, Posture Apprentice, Stretch Scout, Swivel Chair Escapee, Circulation Knight, Momentum Wrangler, Standing Desk Nomad, Focus Buff Alchemist, Kinetic Virtuoso, Desk Escapist.
- Tier button copy exactly: "🌱 Easy · 1 min · +10 XP", "🚶 Medium · 2 min · +20 XP", "🔥 Hard · 3 min · +35 XP". Snooze link copy: "Snooze 15 min".
- Choice card heading "Focus Buff available"; subline "2 minutes of movement raises blood flow to your brain. Sharper thinking for the next hour."
- All colors via CSS custom properties (existing warm design system classes/variables).
- Existing tests must keep passing; service worker cache name becomes `wfh-movement-v5` in the final task.

---

### Task 1: game.js module (XP, levels, titles, progress)

**Files:**
- Create: `game.js`
- Test: `tests/game.test.js`

**Interfaces:**
- Consumes: `getState()`, `saveState(state)` from `./storage.js` (existing; state is a plain object persisted to localStorage).
- Produces: `TIER_XP` (`{ easy: 10, medium: 20, hard: 35 }`), `TIER_DURATION` (`{ easy: 60, medium: 120, hard: 180 }`), `LEVELS` (array of `{ threshold, title }`), `levelForXp(xp) -> number (1-10)`, `awardBreak(tier) -> { xpGained, totalXp, level, leveledUp, title }`, `getProgress() -> { xp, level, title, xpIntoLevel, xpForNext }` (`xpForNext` is `null` at level 10).

- [ ] **Step 1: Write the failing tests**

Create `tests/game.test.js` (follow the import/style pattern of `tests/storage.test.js`, which sets up the localStorage stub via `tests/run.js` helpers):

```js
import { test, run } from './run.js';
import { TIER_XP, TIER_DURATION, LEVELS, levelForXp, awardBreak, getProgress } from '../game.js';
import { resetAll } from '../storage.js';

test('tier XP and durations match spec', () => {
  if (TIER_XP.easy !== 10 || TIER_XP.medium !== 20 || TIER_XP.hard !== 35) throw new Error('bad TIER_XP');
  if (TIER_DURATION.easy !== 60 || TIER_DURATION.medium !== 120 || TIER_DURATION.hard !== 180) throw new Error('bad TIER_DURATION');
});

test('LEVELS has 10 entries ending at Desk Escapist', () => {
  if (LEVELS.length !== 10) throw new Error('expected 10 levels');
  if (LEVELS[0].title !== 'Chair Dweller' || LEVELS[9].title !== 'Desk Escapist') throw new Error('bad titles');
  if (LEVELS[9].threshold !== 3200) throw new Error('bad top threshold');
});

test('levelForXp at exact thresholds and one below', () => {
  if (levelForXp(0) !== 1) throw new Error('0 xp should be level 1');
  if (levelForXp(99) !== 1) throw new Error('99 xp should be level 1');
  if (levelForXp(100) !== 2) throw new Error('100 xp should be level 2');
  if (levelForXp(3199) !== 9) throw new Error('3199 xp should be level 9');
  if (levelForXp(3200) !== 10) throw new Error('3200 xp should be level 10');
  if (levelForXp(99999) !== 10) throw new Error('level caps at 10');
});

test('awardBreak accumulates XP and reports level-up', () => {
  resetAll();
  const first = awardBreak('hard');
  if (first.xpGained !== 35 || first.totalXp !== 35) throw new Error('bad first award');
  if (first.level !== 1 || first.leveledUp) throw new Error('should still be level 1');
  let r;
  for (let i = 0; i < 2; i++) r = awardBreak('hard'); // 105 total
  if (r.totalXp !== 105 || r.level !== 2 || !r.leveledUp) throw new Error('expected level-up at 105 xp');
  if (r.title !== 'Posture Apprentice') throw new Error('bad level 2 title');
});

test('getProgress derives level from stored XP with defaults', () => {
  resetAll();
  const p0 = getProgress();
  if (p0.xp !== 0 || p0.level !== 1 || p0.title !== 'Chair Dweller') throw new Error('bad default progress');
  awardBreak('medium'); // 20
  const p = getProgress();
  if (p.xp !== 20 || p.xpIntoLevel !== 20 || p.xpForNext !== 100) throw new Error('bad progress math');
});

test('getProgress at level 10 has null xpForNext', () => {
  resetAll();
  for (let i = 0; i < 92; i++) awardBreak('hard'); // 3220 xp
  const p = getProgress();
  if (p.level !== 10 || p.xpForNext !== null) throw new Error('level 10 should have null xpForNext');
});

run();
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/game.test.js`
Expected: FAIL (cannot find module `../game.js`).

- [ ] **Step 3: Implement game.js**

```js
// game.js -- gamification: XP, levels, titles, buff copy
import { getState, saveState } from './storage.js';

export const TIER_XP = { easy: 10, medium: 20, hard: 35 };
export const TIER_DURATION = { easy: 60, medium: 120, hard: 180 };

export const LEVELS = [
  { threshold: 0, title: 'Chair Dweller' },
  { threshold: 100, title: 'Posture Apprentice' },
  { threshold: 250, title: 'Stretch Scout' },
  { threshold: 450, title: 'Swivel Chair Escapee' },
  { threshold: 700, title: 'Circulation Knight' },
  { threshold: 1000, title: 'Momentum Wrangler' },
  { threshold: 1400, title: 'Standing Desk Nomad' },
  { threshold: 1900, title: 'Focus Buff Alchemist' },
  { threshold: 2500, title: 'Kinetic Virtuoso' },
  { threshold: 3200, title: 'Desk Escapist' }
];

export const BUFF_COPY = {
  promptTitle: 'Focus Buff available',
  promptSubline: '2 minutes of movement raises blood flow to your brain. Sharper thinking for the next hour.',
  applied: 'Focus Buff applied'
};

export function levelForXp(xp) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) level = i + 1;
  }
  return level;
}

function currentXp() {
  const state = getState();
  return (state.game && state.game.xp) || 0;
}

export function awardBreak(tier) {
  const prevXp = currentXp();
  const xpGained = TIER_XP[tier] || 0;
  const totalXp = prevXp + xpGained;
  const state = getState();
  state.game = { xp: totalXp };
  saveState(state);
  const level = levelForXp(totalXp);
  return {
    xpGained,
    totalXp,
    level,
    leveledUp: level > levelForXp(prevXp),
    title: LEVELS[level - 1].title
  };
}

export function getProgress() {
  const xp = currentXp();
  const level = levelForXp(xp);
  const currentThreshold = LEVELS[level - 1].threshold;
  const nextThreshold = level < LEVELS.length ? LEVELS[level].threshold : null;
  return {
    xp,
    level,
    title: LEVELS[level - 1].title,
    xpIntoLevel: xp - currentThreshold,
    xpForNext: nextThreshold === null ? null : nextThreshold - currentThreshold
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --experimental-vm-modules tests/game.test.js`
Expected: 6 passed, 0 failed. Also run the other four test files to confirm nothing regressed.

- [ ] **Step 5: Commit**

```bash
git add game.js tests/game.test.js
git commit -m "feat: game module with XP, levels, and titles"
```

---

### Task 2: Exercise tiers and 8 hard exercises

**Files:**
- Modify: `exercises.js` (add `tier` to all 24, append 8 hard exercises)
- Test: `tests/exercises.test.js` (extend)

**Interfaces:**
- Produces: every exercise has `tier: 'easy' | 'medium' | 'hard'`. Tier assignment for existing 24:
  - `easy` (12): chin-tucks, lateral-neck-stretch, levator-scapulae-stretch, neck-rolls, wrist-flexor-stretch, wrist-extensor-stretch, prayer-stretch, forearm-supination, wrist-circles, seated-spinal-twist, cross-body-shoulder-stretch, overhead-reach
  - `medium` (12): hip-flexor-stretch, glute-bridge, figure-four-stretch, lateral-hip-circles, calf-raises, cat-cow, thoracic-rotation, dead-bug, standing-backbend, doorway-chest-opener, shoulder-blade-squeeze, wall-angels
  - `hard` (8 new, targetArea in parens): bodyweight-squats (hips), desk-pushups (shoulders), jumping-jacks (cardio), high-knees (cardio), alternating-lunges (hips), wall-sit (hips), stair-climbs (cardio), mountain-climbers (spine)

- [ ] **Step 1: Extend the tests (failing first)**

Add to `tests/exercises.test.js` before `run()`:

```js
test('every exercise has a valid tier', () => {
  const valid = ['easy', 'medium', 'hard'];
  for (const ex of EXERCISES) {
    if (!valid.includes(ex.tier)) throw new Error(`${ex.id} has invalid tier: ${ex.tier}`);
  }
});

test('library has 32 exercises with 8 hard', () => {
  if (EXERCISES.length !== 32) throw new Error(`expected 32, got ${EXERCISES.length}`);
  const hard = EXERCISES.filter(e => e.tier === 'hard');
  if (hard.length !== 8) throw new Error(`expected 8 hard, got ${hard.length}`);
});

test('every tier has at least two target areas for rotation', () => {
  for (const tier of ['easy', 'medium', 'hard']) {
    const areas = new Set(EXERCISES.filter(e => e.tier === tier).map(e => e.targetArea));
    if (areas.size < 2) throw new Error(`tier ${tier} has fewer than 2 areas`);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/exercises.test.js`
Expected: FAIL (invalid tier: undefined).

- [ ] **Step 3: Tag existing exercises and append the hard eight**

Add `tier: 'easy'` or `tier: 'medium'` to each existing exercise per the assignment above (place after `targetArea`). Then append before the closing `];`:

```js
  // --- HARD TIER: heart-rate movers ---
  {
    id: 'bodyweight-squats',
    name: 'Bodyweight Squats',
    targetArea: 'hips',
    tier: 'hard',
    description: 'Fires the largest muscles in your body to spike circulation and re-energize your legs.',
    cues: [
      'Feet shoulder-width apart, toes slightly out',
      'Sit your hips back and down like reaching for a low chair',
      'Drive through your heels to stand tall, squeezing your glutes at the top'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'bodyweight-squats.svg'
  },
  {
    id: 'desk-pushups',
    name: 'Desk Pushups',
    targetArea: 'shoulders',
    tier: 'hard',
    description: 'Builds pressing strength and wakes up your chest and arms using nothing but your desk.',
    cues: [
      'Hands on the desk edge, slightly wider than shoulders, body in a straight line',
      'Lower your chest toward the desk with elbows at 45 degrees',
      'Press back up without letting your hips sag'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'desk-pushups.svg'
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    targetArea: 'cardio',
    tier: 'hard',
    description: 'A full-body classic that raises your heart rate fast and shakes off desk stiffness everywhere at once.',
    cues: [
      'Start standing, arms at your sides',
      'Jump feet wide while sweeping your arms overhead',
      'Land softly on the balls of your feet and keep a steady rhythm'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'jumping-jacks.svg'
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    targetArea: 'cardio',
    tier: 'hard',
    description: 'Drives your heart rate up and re-activates the hip flexors in the opposite direction sitting locks them.',
    cues: [
      'Run in place, driving each knee up toward hip height',
      'Stay light on the balls of your feet',
      'Pump your arms and keep your chest tall'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'high-knees.svg'
  },
  {
    id: 'alternating-lunges',
    name: 'Alternating Lunges',
    targetArea: 'hips',
    tier: 'hard',
    description: 'Strengthens each leg independently and stretches the hip flexors under load.',
    cues: [
      'Step one foot forward and lower until both knees reach 90 degrees',
      'Keep your front knee over your ankle, not past your toes',
      'Push back to standing and switch legs each rep'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'alternating-lunges.svg'
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    targetArea: 'hips',
    tier: 'hard',
    description: 'An isometric burner that builds leg endurance and posture strength with zero movement.',
    cues: [
      'Back flat against a wall, slide down until knees reach 90 degrees',
      'Keep your weight in your heels and knees over ankles',
      'Breathe steadily and hold; rest and repeat when your legs shake'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'wall-sit.svg'
  },
  {
    id: 'stair-climbs',
    name: 'Stair Climbs',
    targetArea: 'cardio',
    tier: 'hard',
    description: 'Turns any staircase into a cardio machine that pumps blood back up from your lower legs.',
    cues: [
      'Climb at a steady pace, driving through each whole foot',
      'Use the descent as active recovery',
      'No stairs handy? Step up and down on one sturdy step instead'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'stair-climbs.svg'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    targetArea: 'spine',
    tier: 'hard',
    description: 'Combines core stability with cardio by driving your knees while your trunk holds a plank.',
    cues: [
      'Start in a straight-arm plank, shoulders over wrists',
      'Drive one knee toward your chest, then switch in a running rhythm',
      'Keep your hips level and your back flat throughout'
    ],
    quickDuration: 90, fullDuration: 300, illustration: 'mountain-climbers.svg'
  }
```

Also create the 8 matching placeholder SVGs in `illustrations/` by copying an existing placeholder file to each new name (e.g. `cp illustrations/glute-bridge.svg illustrations/bodyweight-squats.svg` and so on for all 8 ids).

- [ ] **Step 4: Run tests to verify pass**

Run: `node --experimental-vm-modules tests/exercises.test.js`
Expected: 7 passed (4 existing + 3 new), 0 failed.

- [ ] **Step 5: Commit**

```bash
git add exercises.js tests/exercises.test.js illustrations/
git commit -m "feat: exercise tiers and eight hard exercises"
```

---

### Task 3: Rotation tier filter

**Files:**
- Modify: `rotation.js`
- Test: `tests/rotation.test.js` (extend)

**Interfaces:**
- Consumes: `EXERCISES` with `tier` field (Task 2).
- Produces: `suggestExercise(lastTargetArea, excludeId, tier)` — third param optional; when given, only exercises of that tier are candidates. Existing two-arg calls keep working (tier undefined = all tiers). Fallback order: tier+area-avoid+exclude → tier+exclude → tier → all. Never returns undefined.

- [ ] **Step 1: Extend tests (failing first)**

Add to `tests/rotation.test.js` before `run()`:

```js
test('suggestExercise with tier returns only that tier', () => {
  for (let i = 0; i < 20; i++) {
    const ex = suggestExercise(null, null, 'hard');
    if (ex.tier !== 'hard') throw new Error(`got ${ex.tier} exercise: ${ex.id}`);
  }
});

test('suggestExercise avoids lastTargetArea within tier when possible', () => {
  for (let i = 0; i < 20; i++) {
    const ex = suggestExercise('hips', null, 'hard');
    if (ex.targetArea === 'hips') throw new Error('did not avoid hips within hard tier');
  }
});

test('suggestExercise without tier still works (backward compatible)', () => {
  const ex = suggestExercise('hips', null);
  if (!ex || !ex.id) throw new Error('two-arg call broke');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/rotation.test.js`
Expected: FAIL on the tier test (tier param currently ignored, non-hard exercises returned).

- [ ] **Step 3: Implement the tier filter**

In `rotation.js`, change the signature and add tier filtering as the outermost filter (adapt to the file's existing structure; the logic must be):

```js
export function suggestExercise(lastTargetArea, excludeId, tier) {
  const inTier = tier ? EXERCISES.filter(e => e.tier === tier) : EXERCISES;
  let pool = inTier.filter(e => e.targetArea !== lastTargetArea && e.id !== excludeId);
  if (pool.length === 0) pool = inTier.filter(e => e.id !== excludeId);
  if (pool.length === 0) pool = inTier;
  if (pool.length === 0) pool = EXERCISES;
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --experimental-vm-modules tests/rotation.test.js`
Expected: 8 passed (5 existing + 3 new), 0 failed.

- [ ] **Step 5: Commit**

```bash
git add rotation.js tests/rotation.test.js
git commit -m "feat: tier filter in exercise rotation"
```

---

### Task 4: Choice card and one-tap flow (index.html + app.js)

**Files:**
- Modify: `index.html` (`#dashboard-active` becomes the choice card; timer view gains exercise info + swap button)
- Modify: `app.js` (triggerBreak shows choice card; new `startTierBreak(tier)`; swap moves to timer screen; snooze)

**Interfaces:**
- Consumes: `suggestExercise(lastTargetArea, excludeId, tier)` (Task 3), `TIER_DURATION` and `BUFF_COPY` from `./game.js` (Task 1).
- Produces: element IDs `btn-tier-easy`, `btn-tier-medium`, `btn-tier-hard`, `choice-streak-note`, `link-snooze`, `btn-swap-on-timer`, `timer-exercise-area`; function `startTierBreak(tier)` (used again by Task 6 notification routing); module-level `let currentTier = null;` and `let snoozeTimeout = null;`.

- [ ] **Step 1: Replace `#dashboard-active` card content in index.html**

```html
<div id="dashboard-active" class="hidden">
  <div class="card text-center">
    <h2 style="font-size: 1.3rem; margin-bottom: 0.4rem;">Focus Buff available</h2>
    <p class="text-muted" style="margin-bottom: 1.25rem;">2 minutes of movement raises blood flow to your brain. Sharper thinking for the next hour.</p>

    <button id="btn-tier-easy" class="btn btn-primary btn-full" style="margin-bottom: 0.35rem;">🌱 Easy · 1 min · +10 XP</button>
    <p id="choice-streak-note" class="text-muted hidden" style="font-size: 0.8rem; margin-bottom: 0.75rem;"></p>
    <button id="btn-tier-medium" class="btn btn-primary btn-full" style="margin-bottom: 0.75rem;">🚶 Medium · 2 min · +20 XP</button>
    <button id="btn-tier-hard" class="btn btn-accent btn-full" style="margin-bottom: 1rem;">🔥 Hard · 3 min · +35 XP</button>

    <a id="link-snooze" href="#" class="text-muted" style="font-size: 0.9rem;">Snooze 15 min</a>
  </div>
</div>
```

(The old exercise name/illustration/cues/quick/full/swap elements inside `#dashboard-active` are deleted; `active-exercise-*`, `btn-start-quick`, `btn-start-full`, `btn-swap-exercise` IDs disappear.)

- [ ] **Step 2: Add exercise info and swap to the timer view in index.html**

Inside `#view-timer`, directly under `<h2 id="timer-exercise-name" ...>`, add:

```html
<p id="timer-exercise-area" style="margin-top: -1rem; margin-bottom: 1.25rem; color: rgba(255,255,255,0.7); font-size: 0.9rem;"></p>
```

And next to the skip button (wrap both in a flex row):

```html
<div class="flex gap-4">
  <button id="btn-swap-on-timer" class="btn btn-ghost" style="color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3);">Show me a different one</button>
  <button id="btn-skip-timer" class="btn btn-ghost" style="color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3);">Skip</button>
</div>
```

- [ ] **Step 3: Rewire app.js**

Add imports: `import { TIER_XP, TIER_DURATION, awardBreak, getProgress } from './game.js';`
Add module state: `let currentTier = null;` and `let snoozeTimeout = null;`.

Replace `renderActiveExercise` and the old quick/full/swap listeners with:

```js
function triggerBreak() {
  const streak = getStreak().streak;
  const note = document.getElementById('choice-streak-note');
  if (streak >= 1) {
    note.textContent = `keeps your ${streak}-day streak alive`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
  document.getElementById('dashboard-idle').classList.add('hidden');
  document.getElementById('dashboard-active').classList.remove('hidden');
  showView('dashboard');
}

function startTierBreak(tier) {
  currentTier = tier;
  const record = getTodayRecord();
  currentExercise = suggestExercise(record.lastTargetArea, null, tier);
  launchTimer(currentExercise, TIER_DURATION[tier]);
}

document.getElementById('btn-tier-easy').addEventListener('click', () => startTierBreak('easy'));
document.getElementById('btn-tier-medium').addEventListener('click', () => startTierBreak('medium'));
document.getElementById('btn-tier-hard').addEventListener('click', () => startTierBreak('hard'));

document.getElementById('link-snooze').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('dashboard-active').classList.add('hidden');
  document.getElementById('dashboard-idle').classList.remove('hidden');
  if (snoozeTimeout) clearTimeout(snoozeTimeout);
  snoozeTimeout = setTimeout(triggerBreak, 15 * 60 * 1000);
});

document.getElementById('btn-swap-on-timer').addEventListener('click', () => {
  if (!currentTier || !currentExercise) return;
  const record = getTodayRecord();
  currentExercise = suggestExercise(record.lastTargetArea, currentExercise.id, currentTier);
  launchTimer(currentExercise, TIER_DURATION[currentTier]);
});
```

In `launchTimer`, after setting `timer-exercise-name`, add:

```js
document.getElementById('timer-exercise-area').textContent = capitalize(exercise.targetArea);
```

- [ ] **Step 4: Run all tests, manual check**

Run each `tests/*.test.js` with `node --experimental-vm-modules` — all must pass. Manual: "Take a break now" shows the choice card; each tier button launches a correct-duration timer showing a matching-tier exercise; swap on the timer stays within tier; snooze returns to idle and re-prompts (verify with a temporarily shortened timeout in the console, not by editing code).

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: three-tier choice card with one-tap timer and snooze"
```

---

### Task 5: XP award, reward card, dashboard progress

**Files:**
- Modify: `index.html` (reward card inside the flash element; dashboard level display)
- Modify: `app.js` (award on natural completion only; reward card rendering; dashboard progress)

**Interfaces:**
- Consumes: `awardBreak(tier)`, `getProgress()`, `TIER_XP` from `./game.js`; `currentTier` from Task 4.
- Produces: element IDs `reward-xp`, `reward-buff`, `reward-levelup`, `reward-bar-fill`, `dash-level-title`, `dash-xp-bar-fill`, `dash-xp-label`.

- [ ] **Step 1: Upgrade the completion flash to a reward card in index.html**

Replace the `#timer-complete-flash` element with:

```html
<div id="timer-complete-flash" class="hidden" style="position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--color-primary-deep); font-family: var(--font-heading); color: var(--color-card); z-index: 50;">
  <div style="font-size: 2.5rem; font-weight: 800;">Nice work 🎉</div>
  <div id="reward-xp" style="font-size: 1.75rem; font-weight: 800; color: var(--color-panel-peach);"></div>
  <div id="reward-buff" style="font-size: 1rem; color: rgba(255,255,255,0.85);">Focus Buff applied</div>
  <div style="width: 220px; height: 10px; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden;">
    <div id="reward-bar-fill" style="width: 0%; height: 100%; background: var(--color-card); border-radius: 999px; transition: width 0.8s ease;"></div>
  </div>
  <div id="reward-levelup" class="hidden" style="font-size: 1.25rem; font-weight: 800; color: var(--color-panel-peach);"></div>
</div>
```

- [ ] **Step 2: Add the level display to the dashboard idle card in index.html**

Directly under the stats row (`breaks today` / `day streak`) inside `#dashboard-idle`'s card, add:

```html
<div class="mt-6" style="text-align: left;">
  <div class="flex items-center justify-between" style="margin-bottom: 0.3rem;">
    <span id="dash-level-title" style="font-weight: 800; font-family: var(--font-heading); color: var(--color-primary);"></span>
    <span id="dash-xp-label" class="text-muted" style="font-size: 0.8rem;"></span>
  </div>
  <div style="width: 100%; height: 8px; background: var(--color-panel-sage); border-radius: 999px; overflow: hidden;">
    <div id="dash-xp-bar-fill" style="width: 0%; height: 100%; background: var(--color-primary); border-radius: 999px; transition: width 0.5s ease;"></div>
  </div>
</div>
```

- [ ] **Step 3: Wire the award and displays in app.js**

Add a dashboard progress renderer and call it from `startApp()` and `completeBreak()` (next to `updateDashboardStats()`):

```js
function updateLevelDisplay() {
  const p = getProgress();
  document.getElementById('dash-level-title').textContent = `Level ${p.level} · ${p.title}`;
  const label = document.getElementById('dash-xp-label');
  const fill = document.getElementById('dash-xp-bar-fill');
  if (p.xpForNext === null) {
    label.textContent = `${p.xp} XP · max level`;
    fill.style.width = '100%';
  } else {
    label.textContent = `${p.xpIntoLevel} / ${p.xpForNext} XP`;
    fill.style.width = `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;
  }
}
```

Change the timer `onComplete` callback so XP is awarded only on natural completion (skip pays nothing — the skip handler keeps calling `completeBreak` directly and never touches awardBreak):

```js
function onComplete() {
  playTone(659, 300);
  setTimeout(() => playTone(784, 400), 350);

  const result = awardBreak(currentTier);
  document.getElementById('reward-xp').textContent = `+${result.xpGained} XP`;
  const p = getProgress();
  const barFill = document.getElementById('reward-bar-fill');
  barFill.style.width = '0%';
  const levelupEl = document.getElementById('reward-levelup');
  if (result.leveledUp) {
    levelupEl.textContent = `Level ${result.level} unlocked: ${result.title}`;
    levelupEl.classList.remove('hidden');
    setTimeout(() => playTone(880, 400), 750);
  } else {
    levelupEl.classList.add('hidden');
  }
  document.getElementById('timer-complete-flash').classList.remove('hidden');
  requestAnimationFrame(() => {
    barFill.style.width = p.xpForNext === null ? '100%' : `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;
  });
  const holdMs = result.leveledUp ? 2500 : 1500;
  setTimeout(() => {
    document.getElementById('timer-complete-flash').classList.add('hidden');
    completeBreak(currentExercise);
  }, holdMs);
}
```

Add `updateLevelDisplay();` next to every `updateDashboardStats();` call (in `startApp` and `completeBreak`).

- [ ] **Step 4: Run all tests, manual check**

All `tests/*.test.js` pass. Manual: complete an easy break end to end; reward card shows "+10 XP", bar animates, dashboard shows "Level 1 · Chair Dweller" with "10 / 100 XP". Skip a break: no XP, no reward numbers, instant return.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: XP reward card and dashboard level progress"
```

---

### Task 6: Notification actions, cache v5, ship

**Files:**
- Modify: `service-worker.js` (notification actions + tier routing; cache name only line change plus notification handlers)
- Modify: `app.js` (nudge copy; handle tier messages from SW)
- Modify: `reminder.js` — NOT allowed; the notification payload it posts is unchanged. The SW adds actions itself.

**Interfaces:**
- Consumes: `startTierBreak(tier)` (Task 4), `triggerBreak()`.
- Produces: SW notification actions `['easy','medium','hard']`; SW → page message `{ type: 'START_TIER', tier }`.

- [ ] **Step 1: Update the service worker**

Change `CACHE_NAME` to `'wfh-movement-v5'` and add `'/game.js'` to `ASSETS`. In the `message` handler where the notification is shown, set title/body/actions:

```js
self.registration.showNotification('Focus Buff available', {
  body: 'Pick your energy: easy, medium, or hard',
  tag: 'wfh-movement-break',
  renotify: true,
  actions: [
    { action: 'easy', title: '🌱 Easy' },
    { action: 'medium', title: '🚶 Medium' },
    { action: 'hard', title: '🔥 Hard' }
  ]
});
```

Replace the `notificationclick` handler:

```js
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tier = ['easy', 'medium', 'hard'].includes(event.action) ? event.action : null;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const client = list[0];
      if (client) {
        client.focus();
        if (tier) client.postMessage({ type: 'START_TIER', tier });
        else client.postMessage({ type: 'SHOW_CHOICE' });
        return;
      }
      const url = tier ? `/?tier=${tier}` : '/';
      return clients.openWindow(url);
    })
  );
});
```

(Browsers without action support simply show a plain notification; tapping it hits the `tier === null` path and opens the choice card. No separate code path needed.)

- [ ] **Step 2: Handle SW messages and the URL param in app.js**

Add near the service worker registration:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'START_TIER') startTierBreak(data.tier);
    if (data.type === 'SHOW_CHOICE') triggerBreak();
  });
}

const tierParam = new URLSearchParams(window.location.search).get('tier');
if (tierParam && ['easy', 'medium', 'hard'].includes(tierParam) && !isFirstVisit()) {
  startApp();
  startTierBreak(tierParam);
}
```

Guard the boot block so it does not double-start when `tierParam` handled it (wrap the existing `if (isFirstVisit()) ... else startApp()` in `if (!tierParam || isFirstVisit()) { ... }`).

- [ ] **Step 3: Run all tests**

All `tests/*.test.js` pass (SW and app.js glue have no unit tests; the frozen modules' tests prove no regression).

- [ ] **Step 4: Full manual pass**

Clear localStorage and hard-refresh: landing → setup → choice card appears immediately → each tier works → reward card → level bar. Returning visit: dashboard shows level. On Chrome, trigger a notification and tap an action button: timer launches for that tier without any intermediate screen.

- [ ] **Step 5: Commit and push (Netlify auto-deploys)**

```bash
git add service-worker.js app.js
git commit -m "feat: notification tier actions and v5 cache, ship gamification loop"
git push
```

- [ ] **Step 6: Verify live**

Fetch https://symphonious-rabanadas-9731f3.netlify.app/ and confirm it serves; remind the user to hard-refresh once (Ctrl+Shift+R) for the v5 service worker.
