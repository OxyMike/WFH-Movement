// rotation.js
import { EXERCISES } from './exercises.js';

export function suggestExercise(lastTargetArea, excludeId) {
  let pool = lastTargetArea
    ? EXERCISES.filter(e => e.targetArea !== lastTargetArea)
    : [...EXERCISES];

  if (pool.length === 0) pool = [...EXERCISES];

  if (excludeId) pool = pool.filter(e => e.id !== excludeId);

  if (pool.length === 0) {
    pool = lastTargetArea
      ? EXERCISES.filter(e => e.targetArea !== lastTargetArea)
      : [...EXERCISES];
  }

  if (pool.length === 0) pool = [...EXERCISES];

  return pool[Math.floor(Math.random() * pool.length)];
}
