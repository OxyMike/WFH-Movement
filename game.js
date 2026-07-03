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
  return (state && state.game && state.game.xp) || 0;
}

export function awardBreak(tier) {
  const prevXp = currentXp();
  const xpGained = TIER_XP[tier] || 0;
  const totalXp = prevXp + xpGained;
  const state = getState() || {};
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
