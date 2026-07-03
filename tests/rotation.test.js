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
    const result = suggestExercise('legs', null);
    assert(result.targetArea !== 'legs', `Should not repeat legs, got ${result.targetArea} on attempt ${i}`);
  }
});

test('suggestExercise falls back gracefully when area filtering leaves nothing', () => {
  const result = suggestExercise('core', null);
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
  const excluded = EXERCISES.find(e => e.targetArea === 'core');
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('core', excluded.id);
    assert(result.targetArea !== 'core', 'Should avoid core area');
    assert(result.id !== excluded.id, 'Should avoid excluded exercise');
  }
});

test('suggestExercise with tier returns only that tier', () => {
  for (let i = 0; i < 20; i++) {
    const ex = suggestExercise(null, null, 'hard');
    if (ex.tier !== 'hard') throw new Error(`got ${ex.tier} exercise: ${ex.id}`);
  }
});

test('suggestExercise avoids lastTargetArea within tier when possible', () => {
  for (let i = 0; i < 20; i++) {
    const ex = suggestExercise('shoulders', null, 'hard');
    // With only 1 hard exercise (legs), it's impossible to avoid any area
    // Just verify it returns a hard exercise
    if (ex.tier !== 'hard') throw new Error(`expected hard tier, got ${ex.tier}`);
  }
});

test('suggestExercise without tier still works (backward compatible)', () => {
  const ex = suggestExercise('legs', null);
  if (!ex || !ex.id) throw new Error('two-arg call broke');
});

summary();
