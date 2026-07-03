// insights.js -- derived stats: week totals, area balance, sitting timer
import { getState, saveState, localDateString } from './storage.js';

const AREAS = ['neck', 'shoulders', 'core', 'wrists', 'legs'];
const LEGACY_AREAS = { hips: 'legs', spine: 'core', cardio: 'legs' };

function normalizeArea(area) {
  return LEGACY_AREAS[area] || area;
}

export function recordDaySummary({ date, minutes, targetArea }) {
  const state = getState() || {};
  const log = state.dayLog || {};
  const day = log[date] || { count: 0, minutes: 0, areas: {} };
  day.count += 1;
  day.minutes += minutes || 0;
  const area = normalizeArea(targetArea);
  day.areas[area] = (day.areas[area] || 0) + 1;
  log[date] = day;
  state.dayLog = log;
  saveState(state);
}

function lastNDates(now, n) {
  const dates = [];
  const d = new Date(now);
  for (let i = 0; i < n; i++) {
    dates.unshift(localDateString(d));
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
    for (const [raw, n] of Object.entries(areas)) {
      const a = normalizeArea(raw);
      if (a in counts) counts[a] += n;
    }
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
