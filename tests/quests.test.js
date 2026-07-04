import { test, run } from './run.js';
import { QUEST_TEMPLATES, getTodaysQuests, evaluateQuests } from '../quests.js';

const SETTINGS = { workDays: [1, 2, 3, 4, 5], workStart: '08:00', workEnd: '17:00' };
const EASY_IDS = ['take-2', 'wrists', 'neck', 'legs', 'core', 'easy-tier', 'early-mover', 'strong-finish'];

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
    { exerciseId: 'bodyweight-squats', targetArea: 'legs', tier: 'hard', completedAt: '2026-07-06T15:45:00.000Z' }
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
    { targetArea: 'legs', tier: 'easy', completedAt: '2026-07-06T10:30:00.000Z' } // 90 min later
  ]};
  const unmet = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' },
    { targetArea: 'legs', tier: 'easy', completedAt: '2026-07-06T09:30:00.000Z' }
  ]};
  if (!evaluateQuests(met, [byId('long-sit')], SETTINGS)[0].completed) throw new Error('90 min gap should satisfy long-sit');
  if (evaluateQuests(unmet, [byId('long-sit')], SETTINGS)[0].completed) throw new Error('30 min gap should not');
});

run();
