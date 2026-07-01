// tests/rotation.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { suggestExercise } from '../rotation.js';
import { EXERCISES } from '../exercises.js';

test('suggestExercise returns a valid exercise', () => {
  const result = suggestExercise(null, null);
  assert(result && typeof result.id === 'string', 'Should return an exercise object');
  assert(EXERCISES.find(e => e.id === result.id), 'Returned exercise should exist in EXERCISES');
});

test('suggestExercise avoids the last target area when other areas are available', () => {
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('hips', null);
    assert(result.targetArea !== 'hips', `Should not repeat hips, got ${result.targetArea} on attempt ${i}`);
  }
});

test('suggestExercise falls back gracefully when area filtering leaves nothing', () => {
  const result = suggestExercise('wrists', null);
  assert(result !== null && result !== undefined, 'Should always return an exercise');
});

test('suggestExercise excludes the given exerciseId (swap mechanic)', () => {
  const first = suggestExercise(null, null);
  for (let i = 0; i < 50; i++) {
    const swapped = suggestExercise(null, first.id);
    assert(swapped.id !== first.id, `Excluded exercise ${first.id} should not be returned`);
  }
});

test('suggestExercise satisfies both area and excludeId constraints together', () => {
  const excluded = EXERCISES.find(e => e.targetArea === 'spine');
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('spine', excluded.id);
    assert(result.targetArea !== 'spine', 'Should avoid spine area');
    assert(result.id !== excluded.id, 'Should avoid excluded exercise');
  }
});

summary();
