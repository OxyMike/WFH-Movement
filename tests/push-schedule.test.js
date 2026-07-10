// tests/push-schedule.test.js
import { test, run, assert, assertEqual } from './run.js';
import { toMinutes, localParts, dueReminder } from '../push-schedule.js';

test('toMinutes parses HH:MM', () => {
  assertEqual(toMinutes('08:00'), 480);
  assertEqual(toMinutes('17:45'), 1065);
});

test('localParts derives wall-clock in the target timezone', () => {
  // 2026-07-10 14:45:00 UTC. New York is EDT (UTC-4) in July -> 10:45 local, Friday.
  const now = new Date('2026-07-10T14:45:00Z');
  const p = localParts(now, 'America/New_York');
  assertEqual(p.min, 645);        // 10:45
  assertEqual(p.dow, 5);          // Friday
  assertEqual(p.dateStr, '2026-07-10');
});

test('localParts respects a different zone for the same instant', () => {
  const now = new Date('2026-07-10T14:45:00Z');
  const p = localParts(now, 'America/Los_Angeles'); // PDT UTC-7 -> 07:45
  assertEqual(p.min, 465);
  assertEqual(p.dow, 5);
});

test('localParts handles the local-midnight hour as 0, not 24', () => {
  // 2026-07-11 04:00:00 UTC = 2026-07-11 00:00 EDT
  const p = localParts(new Date('2026-07-11T04:00:00Z'), 'America/New_York');
  assertEqual(p.min, 0);
  assertEqual(p.dateStr, '2026-07-11');
});

const S = {
  workStart: '08:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5],
  reminderMode: 'interval', intervalMinutes: 45, fixedTimes: []
};

test('interval: not due before the first slot (start + interval)', () => {
  assertEqual(dueReminder(S, '2026-07-10', 5, 500, null), null); // 8:20 < 8:45
});

test('interval: first slot fires once, then dedups', () => {
  const k = dueReminder(S, '2026-07-10', 5, 525, null); // 8:45
  assertEqual(k, '2026-07-10T525');
  assertEqual(dueReminder(S, '2026-07-10', 5, 530, '2026-07-10T525'), null); // already sent
});

test('interval: next slot fires with a new key', () => {
  assertEqual(dueReminder(S, '2026-07-10', 5, 572, '2026-07-10T525'), '2026-07-10T570');
});

test('interval: nothing on a non-workday', () => {
  assertEqual(dueReminder(S, '2026-07-11', 6, 600, null), null); // Saturday
});

test('interval: nothing outside the work window', () => {
  assertEqual(dueReminder(S, '2026-07-10', 5, 479, null), null);  // before start
  assertEqual(dueReminder(S, '2026-07-10', 5, 1020, null), null); // at/after end
});

const F = { ...S, reminderMode: 'fixed', fixedTimes: ['10:00', '14:00'] };

test('fixed: fires at the most recent past fixed time, dedups', () => {
  assertEqual(dueReminder(F, '2026-07-10', 5, 605, null), '2026-07-10T600');
  assertEqual(dueReminder(F, '2026-07-10', 5, 605, '2026-07-10T600'), null);
  assertEqual(dueReminder(F, '2026-07-10', 5, 845, '2026-07-10T600'), '2026-07-10T840');
});

test('fixed: not due before the first fixed time', () => {
  assertEqual(dueReminder(F, '2026-07-10', 5, 590, null), null); // before 10:00
});

test('fixed: ignores fixed times outside the work window', () => {
  const F2 = { ...F, fixedTimes: ['07:00', '20:00'] }; // both outside 08:00-17:00
  assertEqual(dueReminder(F2, '2026-07-10', 5, 1000, null), null);
});

run();
