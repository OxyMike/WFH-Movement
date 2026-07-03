// storage.js
const KEY = 'wfh-movement';

const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full',
  workDays: [1, 2, 3, 4, 5]
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getState() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isFirstVisit() {
  return getState() === null;
}

export function getSettings() {
  const state = getState();
  return state ? { ...DEFAULT_SETTINGS, ...state.settings } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  const state = getState() ?? {};
  saveState({ ...state, settings: { ...DEFAULT_SETTINGS, ...settings } });
}

export function getTodayRecord() {
  const state = getState();
  const today = todayString();
  if (!state || !state.today || state.today.date !== today) {
    return { date: today, completedBreaks: [], lastTargetArea: null };
  }
  return state.today;
}

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

export function resetAll() {
  localStorage.removeItem(KEY);
}

function previousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

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
