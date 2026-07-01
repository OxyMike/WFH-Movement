// tests/reminder.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { isWithinWorkWindow, getNextReminderMs } from '../reminder.js';

const baseSettings = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full'
};

function makeDate(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

test('isWithinWorkWindow: inside window returns true', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('10:00')) === true);
});

test('isWithinWorkWindow: before window returns false', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('07:59')) === false);
});

test('isWithinWorkWindow: after window returns false', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('17:01')) === false);
});

test('isWithinWorkWindow: exactly at start returns true', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('08:00')) === true);
});

test('getNextReminderMs interval mode: returns positive ms when inside window', () => {
  const ms = getNextReminderMs(baseSettings, makeDate('09:00'));
  assert(typeof ms === 'number' && ms > 0, `Expected positive ms, got ${ms}`);
  assert(ms <= 45 * 60 * 1000, `Should be at most 45 minutes, got ${ms}`);
});

test('getNextReminderMs interval mode: returns null outside window', () => {
  const ms = getNextReminderMs(baseSettings, makeDate('18:00'));
  assertEqual(ms, null, 'Should return null outside work window');
});

test('getNextReminderMs fixed mode: returns ms to next fixed time', () => {
  const settings = { ...baseSettings, reminderMode: 'fixed', fixedTimes: ['10:00', '14:00'] };
  const ms = getNextReminderMs(settings, makeDate('09:30'));
  assert(typeof ms === 'number' && ms > 0);
  const expected = 30 * 60 * 1000;
  assert(Math.abs(ms - expected) < 2000, `Expected ~30min, got ${ms}ms`);
});

test('getNextReminderMs fixed mode: returns null when all times have passed', () => {
  const settings = { ...baseSettings, reminderMode: 'fixed', fixedTimes: ['09:00', '10:00'] };
  const ms = getNextReminderMs(settings, makeDate('11:00'));
  assertEqual(ms, null, 'Should return null when all fixed times passed');
});

summary();
