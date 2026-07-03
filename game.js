// game.js -- gamification: XP, levels, titles, unlock packs
import { getState, saveState } from './storage.js';
import { EXERCISES } from './exercises.js';

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

export function levelForXp(xp) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) level = i + 1;
  }
  return level;
}

function currentXp() {
  const state = getState();
  return (state && state.game && state.game.xp) || 0;
}

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
