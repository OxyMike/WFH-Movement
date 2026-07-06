import { test, run } from './run.js';
import { tightestZone, preferredAreasFrom, coachingFor } from '../coaching.js';

test('tightestZone returns null when nothing logged', () => {
  if (tightestZone({ neck: 0, shoulders: 0, back: 0, wrists: 0, legs: 0 }) !== null)
    throw new Error('expected null');
  if (tightestZone(undefined) !== null) throw new Error('expected null for undefined');
});

test('tightestZone: a single Tight outranks any number of Mild', () => {
  const z = tightestZone({ neck: 1, shoulders: 1, back: 0, wrists: 2, legs: 1 });
  if (z !== 'wrists') throw new Error(`expected wrists, got ${z}`);
});

test('tightestZone tie-break favors earlier in order', () => {
  const z = tightestZone({ neck: 0, shoulders: 2, back: 2, wrists: 0, legs: 0 });
  if (z !== 'shoulders') throw new Error(`expected shoulders, got ${z}`);
});

test('preferredAreasFrom returns only non-zero zones, in order', () => {
  const p = preferredAreasFrom({ neck: 0, shoulders: 1, back: 0, wrists: 2, legs: 0 });
  if (p.join(',') !== 'shoulders,wrists') throw new Error(`got ${p}`);
  if (preferredAreasFrom({ neck: 0, shoulders: 0, back: 0, wrists: 0, legs: 0 }).length !== 0)
    throw new Error('expected empty');
});

test('coachingFor returns the zone headline, or generic for null', () => {
  if (coachingFor('back').headline !== 'Coaching Focus: Thoracic Spinal Twist')
    throw new Error('wrong back headline');
  if (coachingFor(null).headline !== 'Coaching Focus: Posture Recovery')
    throw new Error('wrong generic headline');
  if (coachingFor(null).bullets[0].critical !== false)
    throw new Error('generic bullets are non-critical');
});

run();
