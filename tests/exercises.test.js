// tests/exercises.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { EXERCISES } from '../exercises.js';

const VALID_AREAS = ['hips', 'spine', 'shoulders', 'neck', 'wrists', 'cardio'];

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

test('every exercise has a valid tier', () => {
  const valid = ['easy', 'medium', 'hard'];
  for (const ex of EXERCISES) {
    if (!valid.includes(ex.tier)) throw new Error(`${ex.id} has invalid tier: ${ex.tier}`);
  }
});

test('library has 32 exercises with 8 hard', () => {
  if (EXERCISES.length !== 32) throw new Error(`expected 32, got ${EXERCISES.length}`);
  const hard = EXERCISES.filter(e => e.tier === 'hard');
  if (hard.length !== 8) throw new Error(`expected 8 hard, got ${hard.length}`);
});

test('every tier has at least two target areas for rotation', () => {
  for (const tier of ['easy', 'medium', 'hard']) {
    const areas = new Set(EXERCISES.filter(e => e.tier === tier).map(e => e.targetArea));
    if (areas.size < 2) throw new Error(`tier ${tier} has fewer than 2 areas`);
  }
});

summary();
