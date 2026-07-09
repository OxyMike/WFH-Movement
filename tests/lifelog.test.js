// tests/lifelog.test.js
import { test, run, assert, assertEqual } from './run.js';
import { parseHM, lifelogStatuses } from '../lifelog.js';

test('parseHM converts HH:MM to minutes-of-day', () => {
  assertEqual(parseHM('08:00'), 480);
  assertEqual(parseHM('17:30'), 1050);
  assertEqual(parseHM('00:00'), 0);
});

test('8:00-18:00 window yields 40 fifteen-minute blocks', () => {
  const b = lifelogStatuses(480, 1080, 1080, []);
  assertEqual(b.length, 40);
  assertEqual(b[0].start, 480);
  assertEqual(b[0].end, 495);
  assertEqual(b[39].end, 1080);
});

test('empty or inverted window yields no blocks', () => {
  assertEqual(lifelogStatuses(600, 600, 600, []).length, 0);
  assertEqual(lifelogStatuses(1080, 480, 700, []).length, 0);
});

test('blocks at or after now are away (upcoming)', () => {
  // now = 8:00, whole day ahead
  const b = lifelogStatuses(480, 1080, 480, []);
  assert(b.every(x => x.status === 'away'), 'all future blocks should be away');
});

test('a break lands in exactly one block (start inclusive, end exclusive)', () => {
  // now = 18:00 (all past). One break at 9:07 -> falls in the 9:00-9:15 block (index 4).
  const b = lifelogStatuses(480, 1080, 1080, [547]);
  const active = b.filter(x => x.status === 'active');
  assertEqual(active.length, 1);
  assertEqual(active[0].start, 540); // 9:00
});

test('break exactly on a block boundary counts to the later block', () => {
  // break at 9:15 (555) -> not in 9:00-9:15 (end exclusive), is in 9:15-9:30
  const b = lifelogStatuses(480, 1080, 1080, [555]);
  const active = b.filter(x => x.status === 'active');
  assertEqual(active.length, 1);
  assertEqual(active[0].start, 555);
});

test('past blocks with no break are sedentary', () => {
  // now = 10:00 (600). No breaks. Blocks before 600 sedentary, at/after away.
  const b = lifelogStatuses(480, 1080, 600, []);
  assert(b.filter(x => x.start < 600).every(x => x.status === 'sedentary'), 'past = sedentary');
  assert(b.filter(x => x.start >= 600).every(x => x.status === 'away'), 'future = away');
});

test('non-15-aligned window rounds up the final partial block', () => {
  // 8:00-8:20 = 20 min span -> ceil(20/15) = 2 blocks
  assertEqual(lifelogStatuses(480, 500, 500, []).length, 2);
});

run();
