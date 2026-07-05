import { test, run } from './run.js';
import { suggestExercise } from '../rotation.js';

test('suggestExercise restricts to a preferred zone when one matches', () => {
  for (let i = 0; i < 20; i++) {
    const e = suggestExercise(null, null, null, ['wrists']);
    if (e.targetArea !== 'wrists') throw new Error(`expected wrists, got ${e.targetArea}`);
  }
});

test('suggestExercise ignores empty preferredAreas (regression for existing callers)', () => {
  const e = suggestExercise('neck', null, null, []);
  if (!e || !e.targetArea) throw new Error('expected a valid exercise');
  if (e.targetArea === 'neck') throw new Error('should still avoid lastTargetArea');
});

test('suggestExercise falls back when no exercise matches a preferred zone', () => {
  const e = suggestExercise(null, null, null, ['nonexistent-zone']);
  if (!e || !e.targetArea) throw new Error('expected a fallback exercise, got none');
});

run();
