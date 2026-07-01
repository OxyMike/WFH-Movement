// storage.js
const KEY = 'wfh-movement';

const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full'
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

export function logBreak(exerciseId, targetArea) {
  const state = getState() ?? {};
  const today = getTodayRecord();
  const history = state.history ?? { streak: 0, totalBreaks: 0, lastActiveDate: null };

  today.completedBreaks.push({
    exerciseId,
    targetArea,
    completedAt: new Date().toISOString()
  });
  today.lastTargetArea = targetArea;

  const todayStr = todayString();
  if (history.lastActiveDate === todayStr) {
    // already counted today, no streak change
  } else if (history.lastActiveDate === previousDay(todayStr)) {
    history.streak += 1;
  } else {
    history.streak = 1;
  }
  history.lastActiveDate = todayStr;
  history.totalBreaks = (history.totalBreaks || 0) + 1;

  saveState({ ...state, today, history });
}

export function getStreak() {
  const state = getState();
  return state?.history ?? { streak: 0, totalBreaks: 0 };
}

export function resetAll() {
  localStorage.removeItem(KEY);
}

function previousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
