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
  { id: 'legs', title: 'Wake up your legs', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'legs') },
  { id: 'core', title: 'Straighten the desk slump', bonusXp: 15, target: 1,
    progress: d => countBy(d, b => b.targetArea === 'core') },
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

const EASY_SATISFIABLE = new Set(['take-2', 'wrists', 'neck', 'legs', 'core', 'easy-tier', 'early-mover', 'strong-finish']);

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
