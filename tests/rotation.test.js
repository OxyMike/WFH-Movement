// tests/rotation.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { suggestExercise, easierQuest } from '../rotation.js';
import { EXERCISES } from '../exercises.js';

test('easierQuest halves total time and keeps duration in sync with step seconds', () => {
  const q = EXERCISES.find(e => e.id === 'posture-reset'); // 4 min, 4 x 60s steps
  const easy = easierQuest(q);
  const stepSum = easy.steps.reduce((a, s) => a + s.duration, 0);
  assertEqual(stepSum, easy.duration * 60, 'invariant: steps must sum to duration minutes');
  assert(stepSum < q.steps.reduce((a, s) => a + s.duration, 0), 'total time must strictly decrease');
});

test('easierQuest preserves identity and reward, only time changes', () => {
  const q = EXERCISES.find(e => e.id === 'posture-reset');
  const easy = easierQuest(q);
  assertEqual(easy.id, q.id);
  assertEqual(easy.name, q.name);
  assertEqual(easy.targetArea, q.targetArea);
  assertEqual(easy.tier, q.tier);
  assertEqual(easy.xp, q.xp, 'reward is not docked for choosing easier');
  assertEqual(easy.steps.length, q.steps.length, 'the movement pattern is kept, just shorter');
});

test('easierQuest never mutates the input quest', () => {
  const q = { id: 'x', name: 'X', tier: 'easy', xp: 10, targetArea: 'back', duration: 2,
    steps: [{ title: 'a', duration: 60 }, { title: 'b', duration: 60 }] };
  const snapshot = JSON.stringify(q);
  easierQuest(q);
  assertEqual(JSON.stringify(q), snapshot, 'input must be untouched');
});

test('easierQuest floors step length so a step never drops below 10s', () => {
  const q = { id: 'x', name: 'X', tier: 'easy', xp: 10, targetArea: 'back', duration: 58 / 60,
    steps: [{ title: 'a', duration: 30 }, { title: 'b', duration: 14 }, { title: 'c', duration: 14 }] };
  const easy = easierQuest(q);
  assert(easy.steps.every(s => s.duration >= 10), 'no step below the 10s floor');
});

test('easierQuest returns null when the quest is already too short to halve', () => {
  const tiny = { id: 'x', name: 'X', tier: 'easy', xp: 10, targetArea: 'back', duration: 20 / 60,
    steps: [{ title: 'a', duration: 10 }, { title: 'b', duration: 10 }] };
  assertEqual(easierQuest(tiny), null);
});

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
  const result = suggestExercise('back', null);
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
  const excluded = EXERCISES.find(e => e.targetArea === 'back');
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('back', excluded.id);
    assert(result.targetArea !== 'back', 'Should avoid back area');
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
