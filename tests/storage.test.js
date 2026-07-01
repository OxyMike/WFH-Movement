// tests/storage.test.js
import { test, assert, assertEqual, summary } from './run.js';

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

import {
  getSettings, saveSettings, getTodayRecord, logBreak,
  getStreak, resetAll, isFirstVisit
} from '../storage.js';

test('isFirstVisit returns true when no data exists', () => {
  resetAll();
  assert(isFirstVisit() === true, 'Should be first visit on clean state');
});

test('isFirstVisit returns false after settings are saved', () => {
  resetAll();
  saveSettings({ workStart: '09:00', workEnd: '17:00', reminderMode: 'interval', intervalMinutes: 45, fixedTimes: [], defaultBreakLength: 'full' });
  assert(isFirstVisit() === false, 'Should not be first visit after settings saved');
});

test('getSettings returns defaults when nothing saved', () => {
  resetAll();
  const s = getSettings();
  assertEqual(s.workStart, '08:00', 'Default workStart');
  assertEqual(s.workEnd, '17:00', 'Default workEnd');
  assertEqual(s.reminderMode, 'interval', 'Default reminderMode');
  assertEqual(s.intervalMinutes, 45, 'Default intervalMinutes');
  assertEqual(s.defaultBreakLength, 'full', 'Default defaultBreakLength');
});

test('saveSettings and getSettings round-trip', () => {
  resetAll();
  saveSettings({ workStart: '09:00', workEnd: '18:00', reminderMode: 'fixed', intervalMinutes: 60, fixedTimes: ['10:00', '14:00'], defaultBreakLength: 'quick' });
  const s = getSettings();
  assertEqual(s.workStart, '09:00');
  assertEqual(s.reminderMode, 'fixed');
  assertEqual(s.fixedTimes.length, 2);
});

test('getTodayRecord returns empty record for today', () => {
  resetAll();
  const record = getTodayRecord();
  assert(Array.isArray(record.completedBreaks), 'completedBreaks should be array');
  assertEqual(record.completedBreaks.length, 0, 'Should start empty');
  assert(record.lastTargetArea === null, 'lastTargetArea should be null');
});

test('logBreak appends to today record', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  const record = getTodayRecord();
  assertEqual(record.completedBreaks.length, 1);
  assertEqual(record.completedBreaks[0].exerciseId, 'hip-flexor-stretch');
  assertEqual(record.lastTargetArea, 'hips');
});

test('logBreak increments totalBreaks', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  logBreak('cat-cow', 'spine');
  assertEqual(getStreak().totalBreaks, 2);
});

test('resetAll clears all data', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  resetAll();
  assert(isFirstVisit() === true, 'Should be first visit after reset');
  assertEqual(getTodayRecord().completedBreaks.length, 0);
});

summary();
