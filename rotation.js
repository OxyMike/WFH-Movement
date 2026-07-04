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

const MIN_STEP_SECONDS = 10;
const MIN_QUEST_SECONDS = 30;

// Return a gentler version of the quest: same movement, half the time.
// Null when the quest is already too short to meaningfully halve.
export function easierQuest(quest) {
  const steps = quest.steps.map(s => ({ ...s, duration: Math.max(MIN_STEP_SECONDS, Math.round(s.duration / 2)) }));
  const total = steps.reduce((a, s) => a + s.duration, 0);
  const currentTotal = quest.steps.reduce((a, s) => a + s.duration, 0);
  if (total >= currentTotal || total < MIN_QUEST_SECONDS) return null;
  return { ...quest, steps, duration: total / 60 };
}
