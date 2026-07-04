import { test, run } from './run.js';
import { shouldAwardGoal } from '../game.js';

test('shouldAwardGoal fires exactly at threshold, once', () => {
  const rec = (n, awarded = false) => ({ completedBreaks: Array(n).fill({}), goalAwarded: awarded });
  if (shouldAwardGoal(rec(3), 4)) throw new Error('should not award below goal');
  if (!shouldAwardGoal(rec(4), 4)) throw new Error('should award exactly at goal');
  if (!shouldAwardGoal(rec(5), 4)) throw new Error('should award when past goal');
  if (shouldAwardGoal(rec(4, true), 4)) throw new Error('should not award a second time');
});

test('shouldAwardGoal treats a missing completedBreaks as zero', () => {
  if (shouldAwardGoal({}, 1)) throw new Error('empty record must not award');
});

run();
