# Quest Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily seeded quests with bonus XP, workday-aware streaks with an earned streak shield, a sitting timer, and a Progress/insights view.

**Architecture:** New `quests.js` (template pool + seeded selection + evaluation) and `insights.js` (derived stats) beside `game.js`. `storage.js` gets the one deliberate unfreeze: workday streak rules, shield, tier/timestamp logging, workDays setting. `game.js` gains only `awardQuestBonus(xp)`. UI additions ride the warm design system.

**Tech Stack:** Vanilla ES modules, localStorage, existing zero-dependency test runner (`node --experimental-vm-modules tests/<file>`).

## Global Constraints

- Working directory: `D:\ClaudeProjects\wfh-movement`. Product name is **WFH Movement**; the string "FlowDesk" must not appear anywhere.
- Frozen: `timer.js`, `reminder.js`, `rotation.js`, `exercises.js`. `storage.js` and `game.js` are deliberately amended ONLY as this plan specifies.
- No punishment mechanics: quests expire silently, no red states, no "failed" copy. No em dashes in copy.
- Every day's quest trio must include at least one quest satisfiable by a single easy break.
- Quest pool ids and bonus XP exactly as in Task 2's template code.
- Shield: earned at every streak multiple of 5 when not already held; max 1 held; consumption is silent with a one-time gentle note.
- **Spec deviation (approved rationale):** the spec placed shield state in the `game` object, but `game.js#awardBreak` writes `state.game = { xp }` wholesale, which would clobber it. Shield state therefore lives in the storage-owned `history` object. Do not "fix" awardBreak.
- Sitting timer copy must say it counts time since your last break.
- All existing tests (43 + this plan's additions) must pass; SW cache becomes `wfh-movement-v7` in the final task.

---

### Task 1: storage.js workday streaks, shield, tier logging

**Files:**
- Modify: `storage.js`
- Test: `tests/storage.test.js` (extend)

**Interfaces:**
- Consumes: nothing new.
- Produces: `DEFAULT_SETTINGS.workDays = [1, 2, 3, 4, 5]` (JS getDay indices, Mon-Fri); `logBreak(exerciseId, targetArea, tier)` (tier optional, stored as `tier: tier ?? null`); `getStreak() -> { streak, totalBreaks, bestStreak, shieldHeld, shieldUsedFor }`; `acknowledgeShieldUse()` (clears shieldUsedFor after the UI shows the note); exported helpers `isWorkday(dateStr, workDays)` and `previousWorkday(dateStr, workDays)`. History shape: `{ streak, totalBreaks, lastActiveDate, bestStreak, shieldHeld, shieldUsedFor }` with all new fields defaulting for legacy data.

- [ ] **Step 1: Write the failing tests**

Add to `tests/storage.test.js` before `run()` (follow the file's existing stub/reset pattern; `saveSettings`/`logBreak`/`getStreak` are already imported — add `acknowledgeShieldUse`, `isWorkday`, `previousWorkday` to the import). The tests control "today" by writing state directly where needed:

```js
test('workDays defaults to Mon-Fri', () => {
  resetAll();
  const s = getSettings();
  if (JSON.stringify(s.workDays) !== '[1,2,3,4,5]') throw new Error('bad workDays default');
});

test('isWorkday and previousWorkday respect workDays', () => {
  const wd = [1, 2, 3, 4, 5];
  if (isWorkday('2026-07-04', wd)) throw new Error('Saturday is not a workday'); // Sat
  if (!isWorkday('2026-07-06', wd)) throw new Error('Monday is a workday'); // Mon
  if (previousWorkday('2026-07-06', wd) !== '2026-07-03') throw new Error('Mon previous workday should be Fri');
});

test('logBreak stores tier and completedAt', () => {
  resetAll();
  saveSettings({});
  logBreak('chin-tucks', 'neck', 'easy');
  const rec = getTodayRecord();
  const entry = rec.completedBreaks[0];
  if (entry.tier !== 'easy') throw new Error('tier not stored');
  if (!entry.completedAt) throw new Error('completedAt not stored');
});

test('Friday to Monday is consecutive when weekend is off', () => {
  resetAll();
  saveSettings({});
  // Simulate: last active was the previous workday relative to today
  const state = getState() ?? {};
  const todayStr = new Date().toISOString().slice(0, 10);
  const prevWd = previousWorkday(todayStr, [0, 1, 2, 3, 4, 5, 6].filter(d => ![0, 6].includes(d)));
  state.history = { streak: 3, totalBreaks: 3, lastActiveDate: prevWd };
  saveState(state);
  logBreak('chin-tucks', 'neck', 'easy');
  if (getStreak().streak !== 4) throw new Error(`expected 4, got ${getStreak().streak}`);
});

test('missing a workday resets streak without shield', () => {
  resetAll();
  saveSettings({});
  const state = getState() ?? {};
  state.history = { streak: 3, totalBreaks: 3, lastActiveDate: '2020-01-06' }; // long ago
  saveState(state);
  logBreak('chin-tucks', 'neck', 'easy');
  if (getStreak().streak !== 1) throw new Error('streak should reset to 1');
});

test('shield earned at streak 5 and consumed by one missed workday', () => {
  resetAll();
  saveSettings({});
  const todayStr = new Date().toISOString().slice(0, 10);
  const wd = [1, 2, 3, 4, 5];
  // Reach streak 5: pretend yesterday-workday active with streak 4
  let state = getState() ?? {};
  state.history = { streak: 4, totalBreaks: 4, lastActiveDate: previousWorkday(todayStr, wd) };
  saveState(state);
  logBreak('chin-tucks', 'neck', 'easy');
  let h = getStreak();
  if (h.streak !== 5 || !h.shieldHeld) throw new Error('shield should be held at streak 5');
  // Now simulate a gap of exactly one workday: lastActiveDate two workdays back
  state = getState();
  const oneBack = previousWorkday(todayStr, wd);
  const twoBack = previousWorkday(oneBack, wd);
  state.history.lastActiveDate = twoBack;
  state.history.streak = 5;
  saveState(state);
  logBreak('neck-rolls', 'neck', 'easy');
  h = getStreak();
  if (h.streak !== 6) throw new Error(`shield should preserve streak, got ${h.streak}`);
  if (h.shieldHeld) throw new Error('shield should be consumed');
  if (h.shieldUsedFor !== oneBack) throw new Error('shieldUsedFor should name the missed day');
  acknowledgeShieldUse();
  if (getStreak().shieldUsedFor !== null) throw new Error('acknowledge should clear the note');
});

test('bestStreak tracks the maximum and legacy history defaults cleanly', () => {
  resetAll();
  saveSettings({});
  const state = getState() ?? {};
  state.history = { streak: 7, totalBreaks: 9, lastActiveDate: null }; // legacy shape, no new fields
  saveState(state);
  const h = getStreak();
  if (h.bestStreak !== 7) throw new Error('bestStreak should default to current streak');
  if (h.shieldHeld !== false || h.shieldUsedFor !== null) throw new Error('legacy shield defaults wrong');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/storage.test.js`
Expected: FAIL (workDays missing, isWorkday not exported, tier undefined).

- [ ] **Step 3: Implement in storage.js**

Add `workDays: [1, 2, 3, 4, 5]` to `DEFAULT_SETTINGS`. Add exports:

```js
export function isWorkday(dateStr, workDays) {
  return workDays.includes(new Date(dateStr + 'T12:00:00').getDay());
}

export function previousWorkday(dateStr, workDays) {
  let d = dateStr;
  for (let i = 0; i < 14; i++) {
    d = previousDay(d);
    if (isWorkday(d, workDays)) return d;
  }
  return null;
}
```

Replace `logBreak` with:

```js
export function logBreak(exerciseId, targetArea, tier) {
  const state = getState() ?? {};
  const today = getTodayRecord();
  const history = {
    streak: 0, totalBreaks: 0, lastActiveDate: null,
    bestStreak: 0, shieldHeld: false, shieldUsedFor: null,
    ...(state.history ?? {})
  };

  today.completedBreaks.push({
    exerciseId,
    targetArea,
    tier: tier ?? null,
    completedAt: new Date().toISOString()
  });
  today.lastTargetArea = targetArea;

  const todayStr = todayString();
  const workDays = getSettings().workDays;

  if (isWorkday(todayStr, workDays) && history.lastActiveDate !== todayStr) {
    const prevWd = previousWorkday(todayStr, workDays);
    const prevPrevWd = prevWd ? previousWorkday(prevWd, workDays) : null;

    if (history.lastActiveDate === prevWd) {
      history.streak += 1;
    } else if (history.shieldHeld && history.lastActiveDate === prevPrevWd) {
      history.shieldHeld = false;
      history.shieldUsedFor = prevWd;
      history.streak += 1;
    } else {
      history.streak = 1;
    }

    if (history.streak > 0 && history.streak % 5 === 0 && !history.shieldHeld) {
      history.shieldHeld = true;
    }
    history.lastActiveDate = todayStr;
  }

  if (history.streak > (history.bestStreak || 0)) history.bestStreak = history.streak;
  history.totalBreaks = (history.totalBreaks || 0) + 1;

  saveState({ ...state, today, history });
}
```

Replace `getStreak` and add `acknowledgeShieldUse`:

```js
export function getStreak() {
  const state = getState();
  const h = state?.history ?? {};
  return {
    streak: h.streak ?? 0,
    totalBreaks: h.totalBreaks ?? 0,
    bestStreak: Math.max(h.bestStreak ?? 0, h.streak ?? 0),
    shieldHeld: h.shieldHeld ?? false,
    shieldUsedFor: h.shieldUsedFor ?? null
  };
}

export function acknowledgeShieldUse() {
  const state = getState();
  if (!state?.history) return;
  state.history.shieldUsedFor = null;
  saveState(state);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --experimental-vm-modules tests/storage.test.js`
Expected: 15 passed (8 existing + 7 new). Run the other five test files; all pass.

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/storage.test.js
git commit -m "feat: workday streaks, streak shield, tier logging"
```

---

### Task 2: quests.js and awardQuestBonus

**Files:**
- Create: `quests.js`
- Modify: `game.js` (add awardQuestBonus only)
- Test: `tests/quests.test.js` (new), `tests/game.test.js` (extend)

**Interfaces:**
- Consumes: `isWorkday` from `./storage.js`; `getState`, `saveState` from `./storage.js` (via game.js); `levelForXp`, `LEVELS` internals already in game.js.
- Produces: `QUEST_TEMPLATES` (12 entries, ids below), `getTodaysQuests(dateStr, settings) -> template[3] | []`, `evaluateQuests(dayRecord, quests, settings) -> [{ id, title, bonusXp, target, progress, completed }]`, `awardQuestBonus(xp) -> { xpGained, totalXp, level, leveledUp, title }` in game.js.

- [ ] **Step 1: Write failing tests**

Create `tests/quests.test.js` (copy the localStorage stub + `test`/`run` harness pattern from `tests/game.test.js`):

```js
import { test, run } from './run.js';
import { QUEST_TEMPLATES, getTodaysQuests, evaluateQuests } from '../quests.js';

const SETTINGS = { workDays: [1, 2, 3, 4, 5], workStart: '08:00', workEnd: '17:00' };
const EASY_IDS = ['take-2', 'wrists', 'neck', 'hips', 'spine', 'easy-tier', 'early-mover', 'strong-finish'];

test('pool has 12 templates with unique ids', () => {
  if (QUEST_TEMPLATES.length !== 12) throw new Error('expected 12 templates');
  if (new Set(QUEST_TEMPLATES.map(q => q.id)).size !== 12) throw new Error('duplicate ids');
});

test('same date yields same 3 quests, different dates usually differ', () => {
  const a = getTodaysQuests('2026-07-06', SETTINGS).map(q => q.id).join(',');
  const b = getTodaysQuests('2026-07-06', SETTINGS).map(q => q.id).join(',');
  if (a !== b) throw new Error('not deterministic');
  if (getTodaysQuests('2026-07-06', SETTINGS).length !== 3) throw new Error('expected 3 quests');
});

test('every workday selection contains a single-easy-break quest', () => {
  for (let day = 1; day <= 28; day++) {
    const date = `2026-09-${String(day).padStart(2, '0')}`;
    const quests = getTodaysQuests(date, SETTINGS);
    if (quests.length === 0) continue; // weekend
    if (!quests.some(q => EASY_IDS.includes(q.id))) throw new Error(`no easy quest on ${date}`);
  }
});

test('non-workday yields no quests', () => {
  if (getTodaysQuests('2026-07-04', SETTINGS).length !== 0) throw new Error('Saturday should have no quests'); // Sat
});

test('evaluateQuests computes progress and completion', () => {
  const day = { date: '2026-07-06', completedBreaks: [
    { exerciseId: 'chin-tucks', targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:30:00.000Z' },
    { exerciseId: 'bodyweight-squats', targetArea: 'hips', tier: 'hard', completedAt: '2026-07-06T15:45:00.000Z' }
  ]};
  const byId = id => QUEST_TEMPLATES.find(q => q.id === id);
  const evals = evaluateQuests(day, [byId('take-3'), byId('hard-tier'), byId('mix-it-up')], SETTINGS);
  const take3 = evals.find(e => e.id === 'take-3');
  if (take3.progress !== 2 || take3.completed) throw new Error('take-3 should be 2/3');
  if (!evals.find(e => e.id === 'hard-tier').completed) throw new Error('hard-tier should be complete');
  if (!evals.find(e => e.id === 'mix-it-up').completed) throw new Error('mix-it-up should be complete (2 areas)');
});

test('long-sit quest checks a 75 minute gap between breaks', () => {
  const byId = id => QUEST_TEMPLATES.find(q => q.id === id);
  const met = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' },
    { targetArea: 'hips', tier: 'easy', completedAt: '2026-07-06T10:30:00.000Z' } // 90 min later
  ]};
  const unmet = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' },
    { targetArea: 'hips', tier: 'easy', completedAt: '2026-07-06T09:30:00.000Z' }
  ]};
  if (!evaluateQuests(met, [byId('long-sit')], SETTINGS)[0].completed) throw new Error('90 min gap should satisfy long-sit');
  if (evaluateQuests(unmet, [byId('long-sit')], SETTINGS)[0].completed) throw new Error('30 min gap should not');
});

run();
```

Add to `tests/game.test.js` before `run()` (import `awardQuestBonus`):

```js
test('awardQuestBonus adds XP and reports level-up', () => {
  resetAll();
  awardBreak('hard'); // 35
  const r = awardQuestBonus(20);
  if (r.xpGained !== 20 || r.totalXp !== 55) throw new Error('bad bonus math');
  const r2 = awardQuestBonus(50); // 105 total -> level 2
  if (r2.level !== 2 || !r2.leveledUp) throw new Error('bonus should trigger level-up');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/quests.test.js` → FAIL (module not found).
Run: `node --experimental-vm-modules tests/game.test.js` → FAIL (awardQuestBonus not exported).

- [ ] **Step 3: Implement quests.js**

```js
// quests.js -- daily quest templates, seeded selection, evaluation
import { isWorkday } from './storage.js';

function countBy(day, pred) {
  return (day.completedBreaks || []).filter(pred).length;
}

export const QUEST_TEMPLATES = [
  { id: 'take-3', title: 'Take 3 movement breaks', bonusXp: 20, target: 3,
    progress: d => countBy(d, () => true) },
  { id: 'take-2', title: 'Take 2 movement breaks', bonusXp: 15, target: 2,
    progress: d => countBy(d, () => true) },
  { id: 'wrists', title: 'Give your wrists some love', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'wrists') },
  { id: 'neck', title: 'Unknot your neck', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'neck') },
  { id: 'hips', title: 'Wake up your hips', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'hips') },
  { id: 'spine', title: 'Straighten the desk slump', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'spine') },
  { id: 'hard-tier', title: 'Bring the heat', bonusXp: 25, target: 1,
    progress: d => countBy(d, b => b.tier === 'hard') },
  { id: 'easy-tier', title: 'Gentle does it', bonusXp: 10, target: 1,
    progress: d => countBy(d, b => b.tier === 'easy') },
  { id: 'long-sit', title: 'Break up a long sit', bonusXp: 20, target: 1,
    progress: d => {
      const times = (d.completedBreaks || [])
        .filter(b => b.completedAt)
        .map(b => new Date(b.completedAt).getTime())
        .sort((a, b) => a - b);
      for (let i = 1; i < times.length; i++) {
        if (times[i] - times[i - 1] >= 75 * 60 * 1000) return 1;
      }
      return 0;
    } },
  { id: 'mix-it-up', title: 'Mix it up', bonusXp: 15, target: 2,
    progress: d => new Set((d.completedBreaks || []).map(b => b.targetArea)).size >= 2 ? 2
      : Math.min(1, (d.completedBreaks || []).length) },
  { id: 'early-mover', title: 'Early mover', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.completedAt && new Date(b.completedAt).getHours() < 10) },
  { id: 'strong-finish', title: 'Strong finish', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.completedAt && new Date(b.completedAt).getHours() >= 15) }
];

const EASY_SATISFIABLE = new Set(['take-2', 'wrists', 'neck', 'hips', 'spine', 'easy-tier', 'early-mover', 'strong-finish']);

function seedFromDate(dateStr) {
  let h = 0;
  for (const c of dateStr) h = ((h * 31) + c.charCodeAt(0)) >>> 0;
  return h;
}

function nextRand(h) {
  return ((h * 1664525) + 1013904223) >>> 0;
}

export function getTodaysQuests(dateStr, settings) {
  if (!isWorkday(dateStr, settings.workDays)) return [];
  let h = seedFromDate(dateStr);
  const pool = [...QUEST_TEMPLATES];
  const picked = [];
  while (picked.length < 3) {
    h = nextRand(h);
    picked.push(pool.splice(h % pool.length, 1)[0]);
  }
  if (!picked.some(q => EASY_SATISFIABLE.has(q.id))) {
    h = nextRand(h);
    const easies = QUEST_TEMPLATES.filter(q => EASY_SATISFIABLE.has(q.id) && !picked.includes(q));
    picked[2] = easies[h % easies.length];
  }
  return picked;
}

export function evaluateQuests(dayRecord, quests, settings) {
  return quests.map(q => {
    const progress = Math.min(q.target, q.progress(dayRecord));
    return { id: q.id, title: q.title, bonusXp: q.bonusXp, target: q.target, progress, completed: progress >= q.target };
  });
}
```

- [ ] **Step 4: Implement awardQuestBonus in game.js**

Add after `awardBreak` (same read-modify-write pattern; do NOT change awardBreak):

```js
export function awardQuestBonus(xp) {
  const prevXp = currentXp();
  const totalXp = prevXp + xp;
  const state = getState() || {};
  state.game = { xp: totalXp };
  saveState(state);
  const level = levelForXp(totalXp);
  return {
    xpGained: xp,
    totalXp,
    level,
    leveledUp: level > levelForXp(prevXp),
    title: LEVELS[level - 1].title
  };
}
```

- [ ] **Step 5: Run all tests**

Run every `tests/*.test.js`. Expected: quests 6 passed, game 7 passed, others unchanged, no failures.

- [ ] **Step 6: Commit**

```bash
git add quests.js game.js tests/quests.test.js tests/game.test.js
git commit -m "feat: daily quest pool with seeded selection and quest bonus XP"
```

---

### Task 3: insights.js

**Files:**
- Create: `insights.js`
- Test: `tests/insights.test.js`

**Interfaces:**
- Consumes: `getState` from `./storage.js`; `TIER_DURATION` from `./game.js`.
- Produces: `getWeekStats(now) -> { minutesMoved, days: [{ date, count }] x7, streak, bestStreak }`, `getAreaBalance(now) -> [{ area, count }]` (all six areas, last 7 calendar days), `getSittingMinutes(now, settings, todayRecord) -> number | null` (null when outside work hours or no basis).

For week/area stats, history beyond today is needed: extend the daily rollover so past days persist. **Design decision:** `insights.js` reads `state.dayLog` — an object map `{ 'YYYY-MM-DD': { count, minutes, areas: { neck: 2, ... } } }` maintained by app.js at break completion (Task 4 wires it; this task defines the reader plus a `recordDaySummary(entry)` writer here in insights.js so the logic is testable). `recordDaySummary({ date, tier, targetArea })` increments that date's count/minutes/areas in state.

- [ ] **Step 1: Write failing tests**

Create `tests/insights.test.js` (same harness pattern as `tests/game.test.js`):

```js
import { test, run } from './run.js';
import { recordDaySummary, getWeekStats, getAreaBalance, getSittingMinutes } from '../insights.js';
import { resetAll, saveSettings } from '../storage.js';

const SETTINGS = { workStart: '08:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5] };

test('recordDaySummary accumulates count, minutes, areas', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', tier: 'easy', targetArea: 'neck' });
  recordDaySummary({ date: '2026-07-06', tier: 'hard', targetArea: 'hips' });
  const stats = getWeekStats(new Date('2026-07-06T12:00:00'));
  if (stats.minutesMoved !== 4) throw new Error(`easy(1) + hard(3) = 4 min, got ${stats.minutesMoved}`);
  const day = stats.days.find(d => d.date === '2026-07-06');
  if (!day || day.count !== 2) throw new Error('day count wrong');
});

test('getWeekStats covers exactly the last 7 calendar days', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', tier: 'easy', targetArea: 'neck' });
  recordDaySummary({ date: '2026-06-28', tier: 'hard', targetArea: 'hips' }); // 8 days before Jul 6
  const stats = getWeekStats(new Date('2026-07-06T12:00:00'));
  if (stats.days.length !== 7) throw new Error('expected 7 day buckets');
  if (stats.minutesMoved !== 1) throw new Error('old day should not count');
});

test('getAreaBalance lists all six areas with counts', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', tier: 'easy', targetArea: 'neck' });
  const bal = getAreaBalance(new Date('2026-07-06T12:00:00'));
  if (bal.length !== 6) throw new Error('expected 6 areas');
  if (bal.find(a => a.area === 'neck').count !== 1) throw new Error('neck count wrong');
  if (bal.find(a => a.area === 'cardio').count !== 0) throw new Error('cardio should be 0');
});

test('getSittingMinutes measures since last break within work hours', () => {
  const today = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' }
  ]};
  const mins = getSittingMinutes(new Date('2026-07-06T09:45:00.000Z'), SETTINGS, today);
  if (mins !== 45) throw new Error(`expected 45, got ${mins}`);
});

test('getSittingMinutes returns null outside work hours or with no data', () => {
  const empty = { date: '2026-07-06', completedBreaks: [] };
  if (getSittingMinutes(new Date('2026-07-06T09:00:00'), SETTINGS, empty) !== null) throw new Error('no breaks yet should be null');
});

run();
```

Note on the work-hours check: `getSittingMinutes` compares the LOCAL time of `now` against `settings.workStart`/`workEnd` (same approach as reminder.js). The outside-hours test uses a `now` whose local time falls outside 08:00-17:00 only if the test machine's timezone makes it so; to keep it portable, the null test relies on the no-breaks case, and the outside-hours branch is covered by using a `now` at local 23:30: construct it as `new Date('2026-07-06T23:30:00')` (no Z = local) and assert null.

Add that assertion to the last test:

```js
  const withBreak = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' }
  ]};
  if (getSittingMinutes(new Date('2026-07-06T23:30:00'), SETTINGS, withBreak) !== null) throw new Error('outside work hours should be null');
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-vm-modules tests/insights.test.js` → FAIL (module not found).

- [ ] **Step 3: Implement insights.js**

```js
// insights.js -- derived stats: week totals, area balance, sitting timer
import { getState, saveState } from './storage.js';
import { TIER_DURATION } from './game.js';

const AREAS = ['hips', 'spine', 'shoulders', 'neck', 'wrists', 'cardio'];

export function recordDaySummary({ date, tier, targetArea }) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const day = log[date] || { count: 0, minutes: 0, areas: {} };
  day.count += 1;
  day.minutes += tier ? (TIER_DURATION[tier] || 0) / 60 : 0;
  day.areas[targetArea] = (day.areas[targetArea] || 0) + 1;
  log[date] = day;
  state.dayLog = log;
  saveState(state);
}

function lastNDates(now, n) {
  const dates = [];
  const d = new Date(now);
  for (let i = 0; i < n; i++) {
    dates.unshift(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

export function getWeekStats(now) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const h = state.history || {};
  const days = lastNDates(now, 7).map(date => ({ date, count: log[date]?.count || 0 }));
  const minutesMoved = lastNDates(now, 7).reduce((sum, date) => sum + (log[date]?.minutes || 0), 0);
  return {
    minutesMoved: Math.round(minutesMoved),
    days,
    streak: h.streak || 0,
    bestStreak: Math.max(h.bestStreak || 0, h.streak || 0)
  };
}

export function getAreaBalance(now) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const counts = Object.fromEntries(AREAS.map(a => [a, 0]));
  for (const date of lastNDates(now, 7)) {
    const areas = log[date]?.areas || {};
    for (const a of AREAS) counts[a] += areas[a] || 0;
  }
  return AREAS.map(area => ({ area, count: counts[area] }));
}

function minutesOfDay(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function getSittingMinutes(now, settings, todayRecord) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (nowMins < minutesOfDay(settings.workStart) || nowMins > minutesOfDay(settings.workEnd)) return null;
  const times = (todayRecord.completedBreaks || [])
    .filter(b => b.completedAt)
    .map(b => new Date(b.completedAt).getTime());
  if (times.length === 0) return null;
  return Math.max(0, Math.floor((now.getTime() - Math.max(...times)) / 60000));
}
```

- [ ] **Step 4: Run all tests**

Run every `tests/*.test.js`. Expected: insights 5 passed, everything else unchanged.

- [ ] **Step 5: Commit**

```bash
git add insights.js tests/insights.test.js
git commit -m "feat: insights module for week stats, area balance, sitting timer"
```

---

### Task 4: Dashboard quest strip, shield chip, sitting timer, settings toggles

**Files:**
- Modify: `index.html` (quest strip in dashboard idle, shield chip, sitting line, settings workday toggles)
- Modify: `app.js` (quest rendering/award loop, shield note, sitting display, workday settings wiring, XP toast)

**Interfaces:**
- Consumes: `getTodaysQuests`, `evaluateQuests` from `./quests.js`; `awardQuestBonus` from `./game.js`; `getSittingMinutes`, `recordDaySummary` from `./insights.js`; `acknowledgeShieldUse`, extended `getStreak`, `logBreak(exerciseId, targetArea, tier)` from `./storage.js`.
- Produces: element IDs `quest-strip`, `quest-cards`, `shield-chip`, `shield-note`, `sitting-line`, `s-workdays` (container of 7 checkboxes `s-wd-0`..`s-wd-6`), `xp-toast`; function `refreshQuests()` (Task 5's Progress view reuses insights only, not this).

- [ ] **Step 1: Dashboard markup additions in index.html**

Inside `#dashboard-idle`'s card, directly under the stats row and above the level display, add the sitting line and shield elements; below the card add the quest strip:

```html
<p id="sitting-line" class="text-muted hidden" style="font-size: 0.85rem; margin-top: 0.75rem;"></p>
```

Next to the streak flame (inside the streak stat div, after the `#stat-streak` span):

```html
<span id="shield-chip" class="hidden" title="Streak shield: covers one missed workday">🛡️</span>
```

Below the idle card (inside `#dashboard-idle`, after the card):

```html
<p id="shield-note" class="text-muted text-center hidden mt-4" style="font-size: 0.85rem;"></p>
<div id="quest-strip" class="hidden mt-6">
  <h3 style="font-size: 1rem; margin-bottom: 0.6rem;">Today's quests</h3>
  <div id="quest-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;"></div>
</div>
```

XP toast at the end of `<body>` (before the script tag):

```html
<div id="xp-toast" class="hidden" style="position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: var(--color-card); padding: 0.6rem 1.25rem; border-radius: 999px; font-family: var(--font-heading); font-weight: 700; box-shadow: var(--shadow-card); z-index: 60;"></div>
```

Settings modal, below the work-end field:

```html
<div style="margin-bottom: 1.25rem;">
  <label style="display: block; font-weight: 700; margin-bottom: 0.4rem;">Your workdays</label>
  <div id="s-workdays" class="flex gap-4" style="flex-wrap: wrap;">
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-0"> Sun</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-1"> Mon</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-2"> Tue</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-3"> Wed</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-4"> Thu</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-5"> Fri</label>
    <label style="font-size: 0.85rem;"><input type="checkbox" id="s-wd-6"> Sat</label>
  </div>
</div>
```

- [ ] **Step 2: app.js wiring**

Imports: add `getTodaysQuests, evaluateQuests` from `./quests.js`; `awardQuestBonus` from `./game.js`; `getSittingMinutes, recordDaySummary` from `./insights.js`; add `acknowledgeShieldUse` to the storage import.

Quest rendering + award loop (new section; `questsDone` persists in the today record):

```js
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function refreshQuests() {
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  const strip = document.getElementById('quest-strip');
  if (quests.length === 0) { strip.classList.add('hidden'); return; }
  strip.classList.remove('hidden');

  const record = getTodayRecord();
  const evals = evaluateQuests(record, quests, settings);
  const cardsEl = document.getElementById('quest-cards');
  cardsEl.innerHTML = '';
  evals.forEach(q => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding: 0.9rem;';
    card.innerHTML = `
      <div style="font-weight: 700; font-size: 0.9rem;">${q.completed ? '✅ ' : ''}${q.title}</div>
      <div class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">${q.progress}/${q.target} · +${q.bonusXp} XP</div>`;
    cardsEl.appendChild(card);
  });
}

function awardNewQuestCompletions() {
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  if (quests.length === 0) return;
  const state = getState() || {};
  const record = getTodayRecord();
  const done = new Set(record.questsDone || []);
  const evals = evaluateQuests(record, quests, settings);
  evals.filter(q => q.completed && !done.has(q.id)).forEach(q => {
    done.add(q.id);
    const r = awardQuestBonus(q.bonusXp);
    showXpToast(`Quest complete: ${q.title} +${q.bonusXp} XP${r.leveledUp ? ` · Level ${r.level}!` : ''}`);
  });
  record.questsDone = [...done];
  saveState({ ...(getState() || {}), today: record });
}

let toastTimeout = null;
function showXpToast(text) {
  const toast = document.getElementById('xp-toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}
```

(Note: `getState`/`saveState` must be added to the storage import for the questsDone persistence.)

Shield + sitting display (called from startApp and completeBreak, alongside updateDashboardStats):

```js
function updateShieldAndSitting() {
  const h = getStreak();
  document.getElementById('shield-chip').classList.toggle('hidden', !h.shieldHeld);
  const note = document.getElementById('shield-note');
  if (h.shieldUsedFor) {
    const weekday = new Date(h.shieldUsedFor + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
    note.textContent = `your shield covered ${weekday}, streak safe`;
    note.classList.remove('hidden');
    acknowledgeShieldUse();
  }
  const mins = getSittingMinutes(new Date(), getSettings(), getTodayRecord());
  const line = document.getElementById('sitting-line');
  if (mins === null) {
    line.classList.add('hidden');
  } else {
    line.textContent = `Sitting for ${mins} min (since your last break)`;
    line.classList.remove('hidden');
  }
}
```

Refresh the sitting line on the existing 10-second countdown tick (add `updateShieldAndSitting()` inside `startCountdownDisplay`'s tick alongside its other updates — cheap, all local reads).

In `completeBreak`, change `logBreak(exercise.id, exercise.targetArea)` to `logBreak(exercise.id, exercise.targetArea, currentTier)` and, immediately after it, add:

```js
recordDaySummary({ date: todayDateString(), tier: currentTier, targetArea: exercise.targetArea });
awardNewQuestCompletions();
refreshQuests();
```

(Ordering matters: logBreak first so the record includes the break, then summary, then quest evaluation. Note completeBreak's existing `currentTier = null` reset must remain AFTER these lines.)

In `startApp()`, add `refreshQuests(); updateShieldAndSitting();`.

Settings modal: in `openSettingsModal`, populate the 7 checkboxes from `settings.workDays`; in `saveSettingsFromModal`, collect them:

```js
// in openSettingsModal
const workDays = settings.workDays || [1, 2, 3, 4, 5];
for (let d = 0; d < 7; d++) document.getElementById('s-wd-' + d).checked = workDays.includes(d);

// in saveSettingsFromModal, add to the settings object literal:
workDays: [0, 1, 2, 3, 4, 5, 6].filter(d => document.getElementById('s-wd-' + d).checked),
```

After saving settings, also call `refreshQuests()` (workday change can show/hide the strip).

- [ ] **Step 3: Run all tests and manual check**

All `tests/*.test.js` pass. Manual: dashboard shows 3 quest cards on a workday; completing an easy break ticks "Take 2" style quests and fires the toast with bonus XP; the sitting line appears after the first break and resets after the next; settings shows Mon-Fri checked.

- [ ] **Step 4: Commit**

```bash
git add index.html app.js
git commit -m "feat: quest strip, shield chip, sitting timer, workday settings"
```

---

### Task 5: Progress view, cache v7, ship

**Files:**
- Modify: `index.html` (new `#view-progress`, dashboard link)
- Modify: `app.js` (progress rendering, view registration)
- Modify: `service-worker.js` (ASSETS + cache name ONLY)

**Interfaces:**
- Consumes: `getWeekStats`, `getAreaBalance` from `./insights.js`; `showView` (must add 'view-progress' to its id list).

- [ ] **Step 1: Progress view markup**

Add as a sibling of the other views:

```html
<!-- VIEW: Progress -->
<div id="view-progress" class="view">
  <div class="container" style="padding-top: 1.5rem; padding-bottom: 2rem;">
    <button id="btn-back-dashboard" class="btn btn-ghost btn-sm" style="margin-bottom: 1rem;">Back</button>
    <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Your progress</h1>

    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">This week</h3>
      <div class="flex gap-4" style="justify-content: space-around; text-align: center;">
        <div><div id="prog-minutes" style="font-size: 1.75rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-primary);">0</div><p class="text-muted" style="font-size: 0.8rem;">minutes moved</p></div>
        <div><div id="prog-streak" style="font-size: 1.75rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-accent);">0</div><p class="text-muted" style="font-size: 0.8rem;">day streak</p></div>
        <div><div id="prog-best" style="font-size: 1.75rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-primary);">0</div><p class="text-muted" style="font-size: 0.8rem;">best streak</p></div>
      </div>
      <div id="prog-bars" class="flex mt-6" style="align-items: flex-end; gap: 0.4rem; height: 70px; justify-content: space-between;"></div>
    </div>

    <div class="card mt-6">
      <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Body-area balance, last 7 days</h3>
      <div id="prog-areas" class="flex gap-4" style="flex-wrap: wrap;"></div>
      <p id="prog-nudge" class="text-muted" style="font-size: 0.85rem; margin-top: 0.75rem;"></p>
    </div>
  </div>
</div>
```

Dashboard link inside `#dashboard-idle`, next to the existing "Why breaks matter" link:

```html
<a id="link-progress" href="#" style="color: var(--color-text-muted); font-size: 0.9rem; margin-left: 1rem;">See your progress</a>
```

- [ ] **Step 2: app.js progress rendering**

Add `'view-progress'` to the id array in `showView`. Add:

```js
function renderProgress() {
  const now = new Date();
  const stats = getWeekStats(now);
  document.getElementById('prog-minutes').textContent = stats.minutesMoved;
  document.getElementById('prog-streak').textContent = stats.streak;
  document.getElementById('prog-best').textContent = stats.bestStreak;

  const barsEl = document.getElementById('prog-bars');
  barsEl.innerHTML = '';
  const max = Math.max(1, ...stats.days.map(d => d.count));
  stats.days.forEach(d => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;';
    const bar = document.createElement('div');
    bar.style.cssText = `width: 100%; max-width: 28px; border-radius: 6px 6px 0 0; background: var(--color-primary); height: ${Math.max(4, (d.count / max) * 60)}px; opacity: ${d.count === 0 ? 0.2 : 1};`;
    const label = document.createElement('span');
    label.className = 'text-muted';
    label.style.fontSize = '0.7rem';
    label.textContent = new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
    wrap.appendChild(bar);
    wrap.appendChild(label);
    barsEl.appendChild(wrap);
  });

  const balance = getAreaBalance(now);
  const areasEl = document.getElementById('prog-areas');
  areasEl.innerHTML = '';
  balance.forEach(({ area, count }) => {
    const chip = document.createElement('span');
    chip.className = 'badge';
    chip.textContent = `${capitalize(area)} · ${count}`;
    if (count === 0) chip.style.opacity = '0.5';
    areasEl.appendChild(chip);
  });
  const active = balance.filter(b => b.count > 0);
  const nudgeEl = document.getElementById('prog-nudge');
  if (active.length > 0) {
    const least = [...balance].sort((a, b) => a.count - b.count)[0];
    nudgeEl.textContent = `your ${least.area === 'cardio' ? 'heart rate' : least.area} ${least.area === 'hips' || least.area === 'wrists' || least.area === 'shoulders' ? 'have' : 'has'} been patient this week`;
  } else {
    nudgeEl.textContent = 'complete a break and your week starts filling in';
  }
}

document.getElementById('link-progress').addEventListener('click', (e) => {
  e.preventDefault();
  renderProgress();
  showView('progress');
});

document.getElementById('btn-back-dashboard').addEventListener('click', () => showView('dashboard'));
```

- [ ] **Step 3: Service worker**

Change cache name to `'wfh-movement-v7'` and add `'/quests.js'` and `'/insights.js'` to ASSETS. Nothing else.

- [ ] **Step 4: Run all tests and full manual pass**

All `tests/*.test.js` pass. Manual: complete a break, open "See your progress": minutes/streak/bars/areas render; back button returns; quest toast fires on quest completion; settings workday toggles persist; sitting line ticks.

- [ ] **Step 5: Commit and push (controller may defer push until final review)**

```bash
git add index.html app.js service-worker.js
git commit -m "feat: progress view and v7 cache, ship quest board"
```

- [ ] **Step 6: Verify live after push**

Fetch https://symphonious-rabanadas-9731f3.netlify.app/ and confirm "Today's quests" appears in the served HTML; remind the user to hard-refresh (Ctrl+Shift+R).
