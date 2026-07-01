// tests/exercises.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { EXERCISES } from '../exercises.js';

const VALID_AREAS = ['hips', 'spine', 'shoulders', 'neck', 'wrists'];

test('EXERCISES is a non-empty array', () => {
  assert(Array.isArray(EXERCISES), 'EXERCISES should be an array');
  assert(EXERCISES.length >= 20, `Should have at least 20 exercises, got ${EXERCISES.length}`);
});

test('each exercise has required fields', () => {
  for (const ex of EXERCISES) {
    assert(typeof ex.id === 'string' && ex.id.length > 0, `Exercise missing id: ${JSON.stringify(ex)}`);
    assert(typeof ex.name === 'string' && ex.name.length > 0, `Exercise missing name: ${ex.id}`);
    assert(VALID_AREAS.includes(ex.targetArea), `Invalid targetArea "${ex.targetArea}" on ${ex.id}`);
    assert(typeof ex.description === 'string' && ex.description.length > 0, `Exercise missing description: ${ex.id}`);
    assert(Array.isArray(ex.cues) && ex.cues.length >= 2 && ex.cues.length <= 3, `Exercise cues must be 2-3 items: ${ex.id}`);
    assertEqual(ex.quickDuration, 90, `quickDuration must be 90 on ${ex.id}`);
    assertEqual(ex.fullDuration, 300, `fullDuration must be 300 on ${ex.id}`);
    assert(typeof ex.illustration === 'string' && ex.illustration.endsWith('.svg'), `Invalid illustration on ${ex.id}`);
  }
});

test('all exercise ids are unique', () => {
  const ids = EXERCISES.map(e => e.id);
  const unique = new Set(ids);
  assertEqual(unique.size, ids.length, 'Duplicate exercise IDs found');
});

test('all five target areas are represented', () => {
  const areas = new Set(EXERCISES.map(e => e.targetArea));
  for (const area of VALID_AREAS) {
    assert(areas.has(area), `No exercises found for targetArea "${area}"`);
  }
});

summary();
