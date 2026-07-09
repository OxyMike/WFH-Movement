import { test, run, assert, assertEqual } from './run.js';
import { EXERCISES } from '../exercises.js';
import { FIGURES } from '../figures.js';

const CATEGORIES = new Set(['mobility', 'stretch', 'strength', 'quiet']);
const AREAS = new Set(['neck', 'shoulders', 'back', 'wrists', 'legs']);
const TIERS = new Set(['easy', 'medium', 'hard']);

test('36 quests, unique ids', () => {
  assertEqual(EXERCISES.length, 36);
  assertEqual(new Set(EXERCISES.map(e => e.id)).size, 36);
});

test('every quest has valid category, area, tier, xp, duration, desc', () => {
  for (const e of EXERCISES) {
    assert(CATEGORIES.has(e.category), `${e.id}: bad category ${e.category}`);
    assert(AREAS.has(e.targetArea), `${e.id}: bad area ${e.targetArea}`);
    assert(TIERS.has(e.tier), `${e.id}: bad tier ${e.tier}`);
    assert(Number.isFinite(e.xp) && e.xp > 0, `${e.id}: bad xp`);
    assert(Number.isFinite(e.duration) && e.duration > 0, `${e.id}: bad duration`);
    assert(typeof e.desc === 'string' && e.desc.length > 0, `${e.id}: missing desc`);
  }
});

test('every quest has steps whose durations sum to duration minutes', () => {
  for (const e of EXERCISES) {
    assert(Array.isArray(e.steps) && e.steps.length > 0, `${e.id}: no steps`);
    const sum = e.steps.reduce((s, st) => s + st.duration, 0);
    assertEqual(sum, e.duration * 60, `${e.id}: steps sum ${sum} != ${e.duration * 60}`);
  }
});

test('every step names an existing figure', () => {
  for (const e of EXERCISES) {
    for (const st of e.steps) {
      assert(st.svg in FIGURES, `${e.id}: unknown figure ${st.svg}`);
      assert(typeof st.title === 'string' && st.title.length > 0, `${e.id}: step missing title`);
    }
  }
});

test('spec target-area assignments hold', () => {
  const expect = {
    'posture-reset': 'shoulders', 'wrist-stretch': 'wrists', 'back-twist': 'back',
    'calf-raises': 'legs', 'seated-plank': 'back', 'eye-focus': 'neck',
    'shoulder-rolls': 'shoulders', 'deep-breaths': 'back', 'seated-spinal-twist': 'back',
    'figure-4-stretch': 'legs', 'chin-tucks': 'neck', 'wrist-extensor': 'wrists',
    'glute-squeezes': 'legs', 'scapular-retractions': 'shoulders', 'doorway-stretch': 'shoulders',
    'side-bends': 'back', 'hip-flexor-stretch': 'legs', 'hamstring-sweeps': 'legs',
    'sit-to-stand': 'legs', 'standing-calf-raises': 'legs', 'air-squats': 'legs',
    'leg-extensions': 'legs', 'desk-pushups': 'shoulders', 'stair-climbing': 'legs',
    'desk-plank': 'back', 'high-knees': 'legs', 'rebounding': 'legs', 'pacing': 'legs',
    'brugger-relief': 'shoulders', 'couch-stretch': 'legs', 'clamshell-exercise': 'legs',
    'ceiling-reach': 'back', 'micro-stroll': 'legs', 'back-extension': 'back', 'cardio-burst': 'legs',
    'hydration-break': 'wrists'
  };
  for (const [id, area] of Object.entries(expect)) {
    const e = EXERCISES.find(x => x.id === id);
    assert(e, `missing quest ${id}`);
    assertEqual(e.targetArea, area, `${id}`);
  }
});

run();
