import { test, run } from './run.js';
import { recordDaySummary, getWeekStats, getAreaBalance, getSittingMinutes } from '../insights.js';
import { resetAll, saveSettings } from '../storage.js';

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

const SETTINGS = { workStart: '08:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5] };

test('recordDaySummary accumulates count, minutes, areas', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', minutes: 1, targetArea: 'neck' });
  recordDaySummary({ date: '2026-07-06', minutes: 3, targetArea: 'legs' });
  const stats = getWeekStats(new Date('2026-07-06T12:00:00'));
  if (stats.minutesMoved !== 4) throw new Error(`1 + 3 = 4 min, got ${stats.minutesMoved}`);
  const day = stats.days.find(d => d.date === '2026-07-06');
  if (!day || day.count !== 2) throw new Error('day count wrong');
});

test('getWeekStats covers exactly the last 7 calendar days', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', minutes: 1, targetArea: 'neck' });
  recordDaySummary({ date: '2026-06-28', minutes: 3, targetArea: 'legs' }); // 8 days before Jul 6
  const stats = getWeekStats(new Date('2026-07-06T12:00:00'));
  if (stats.days.length !== 7) throw new Error('expected 7 day buckets');
  if (stats.minutesMoved !== 1) throw new Error('old day should not count');
});

test('getAreaBalance lists all five areas with counts', () => {
  resetAll();
  saveSettings({});
  recordDaySummary({ date: '2026-07-06', minutes: 1, targetArea: 'neck' });
  const bal = getAreaBalance(new Date('2026-07-06T12:00:00'));
  if (bal.length !== 5) throw new Error('expected 5 areas');
  if (bal.find(a => a.area === 'neck').count !== 1) throw new Error('neck count wrong');
  if (bal.find(a => a.area === 'legs').count !== 0) throw new Error('legs should be 0');
});

test('legacy areas map on read: hips->legs, spine->core', () => {
  resetAll();
  recordDaySummary({ date: '2026-07-01', minutes: 2, targetArea: 'hips' });
  recordDaySummary({ date: '2026-07-01', minutes: 5, targetArea: 'spine' });
  const balance = getAreaBalance(new Date('2026-07-02T12:00:00'));
  const get = a => balance.find(b => b.area === a).count;
  if (get('legs') !== 1 || get('core') !== 1) throw new Error('legacy mapping failed');
});

test('getSittingMinutes measures since last break within work hours', () => {
  // Use UTC times to avoid timezone issues in test portability
  // 12:00 UTC is always during typical work hours when testing with standard timezone
  const completedTime = new Date('2026-07-06T12:00:00Z');
  const nowTime = new Date(completedTime.getTime() + 45 * 60 * 1000); // 45 minutes later
  const today = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: completedTime.toISOString() }
  ]};
  const mins = getSittingMinutes(nowTime, SETTINGS, today);
  if (mins !== 45) throw new Error(`expected 45, got ${mins}`);
});

test('getSittingMinutes returns null outside work hours or with no data', () => {
  const empty = { date: '2026-07-06', completedBreaks: [] };
  if (getSittingMinutes(new Date('2026-07-06T09:00:00'), SETTINGS, empty) !== null) throw new Error('no breaks yet should be null');
  const withBreak = { date: '2026-07-06', completedBreaks: [
    { targetArea: 'neck', tier: 'easy', completedAt: '2026-07-06T09:00:00.000Z' }
  ]};
  if (getSittingMinutes(new Date('2026-07-06T23:30:00'), SETTINGS, withBreak) !== null) throw new Error('outside work hours should be null');
});

run();
