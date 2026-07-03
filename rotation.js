// rotation.js
import { EXERCISES } from './exercises.js';

export function suggestExercise(lastTargetArea, excludeId, tier) {
  const inTier = tier ? EXERCISES.filter(e => e.tier === tier) : EXERCISES;
  let pool = inTier.filter(e => e.targetArea !== lastTargetArea && e.id !== excludeId);
  if (pool.length === 0) pool = inTier.filter(e => e.id !== excludeId);
  if (pool.length === 0) pool = inTier;
  if (pool.length === 0) pool = EXERCISES;
  return pool[Math.floor(Math.random() * pool.length)];
}
