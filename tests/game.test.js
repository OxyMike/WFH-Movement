import { test, run } from './run.js';
import { LEVELS, levelForXp, awardBreak, getProgress, awardQuestBonus, getUnlocks } from '../game.js';
import { resetAll } from '../storage.js';

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

test('awardBreak takes an xp amount', () => {
  resetAll();
  const first = awardBreak(80);
  if (first.xpGained !== 80 || first.totalXp !== 80) throw new Error('bad first award');
  if (first.level !== 1 || first.leveledUp) throw new Error('should still be level 1');
  const r = awardBreak(40); // 120 total -> level 2
  if (r.totalXp !== 120 || r.level !== 2 || !r.leveledUp) throw new Error('expected level-up at 120 xp');
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
  const first = awardBreak(35);
  if (first.xpGained !== 35 || first.totalXp !== 35) throw new Error('bad first award');
  if (first.level !== 1 || first.leveledUp) throw new Error('should still be level 1');
  let r;
  for (let i = 0; i < 2; i++) r = awardBreak(35); // 105 total
  if (r.totalXp !== 105 || r.level !== 2 || !r.leveledUp) throw new Error('expected level-up at 105 xp');
  if (r.title !== 'Posture Apprentice') throw new Error('bad level 2 title');
});

test('getProgress derives level from stored XP with defaults', () => {
  resetAll();
  const p0 = getProgress();
  if (p0.xp !== 0 || p0.level !== 1 || p0.title !== 'Chair Dweller') throw new Error('bad default progress');
  awardBreak(20); // 20
  const p = getProgress();
  if (p.xp !== 20 || p.xpIntoLevel !== 20 || p.xpForNext !== 100) throw new Error('bad progress math');
});

test('getProgress at level 10 has null xpForNext', () => {
  resetAll();
  for (let i = 0; i < 92; i++) awardBreak(35); // 3220 xp
  const p = getProgress();
  if (p.level !== 10 || p.xpForNext !== null) throw new Error('level 10 should have null xpForNext');
});

test('awardQuestBonus adds XP and reports level-up', () => {
  resetAll();
  awardBreak(35); // 35
  const r = awardQuestBonus(20);
  if (r.xpGained !== 20 || r.totalXp !== 55) throw new Error('bad bonus math');
  const r2 = awardQuestBonus(50); // 105 total -> level 2
  if (r2.level !== 2 || !r2.leveledUp) throw new Error('bonus should trigger level-up');
});

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

run();
