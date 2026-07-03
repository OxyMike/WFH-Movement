import { test, run } from './run.js';
import { TIER_XP, TIER_DURATION, LEVELS, levelForXp, awardBreak, getProgress, awardQuestBonus } from '../game.js';
import { resetAll } from '../storage.js';

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

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

test('awardQuestBonus adds XP and reports level-up', () => {
  resetAll();
  awardBreak('hard'); // 35
  const r = awardQuestBonus(20);
  if (r.xpGained !== 20 || r.totalXp !== 55) throw new Error('bad bonus math');
  const r2 = awardQuestBonus(50); // 105 total -> level 2
  if (r2.level !== 2 || !r2.leveledUp) throw new Error('bonus should trigger level-up');
});

run();
