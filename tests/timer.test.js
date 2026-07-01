// tests/timer.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { formatTime } from '../timer.js';

// Note: startTimer and playTone use browser APIs not available in Node.
// Only the pure formatTime helper is tested here.

test('formatTime formats 0 seconds', () => {
  assertEqual(formatTime(0), '0:00');
});

test('formatTime formats 90 seconds', () => {
  assertEqual(formatTime(90), '1:30');
});

test('formatTime formats 300 seconds', () => {
  assertEqual(formatTime(300), '5:00');
});

test('formatTime formats 65 seconds', () => {
  assertEqual(formatTime(65), '1:05');
});

test('formatTime formats 9 seconds', () => {
  assertEqual(formatTime(9), '0:09');
});

test('formatTime formats 3600 seconds', () => {
  assertEqual(formatTime(3600), '60:00');
});

summary();
