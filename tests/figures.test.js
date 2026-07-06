import { test, run, assert, assertEqual } from './run.js';
import { FIGURES, getFigure } from '../figures.js';

const KEYS = ['shoulders', 'neck', 'wrist', 'twist', 'legs', 'squats', 'pushups',
  'march', 'sidebend', 'eyes', 'calf', 'lunge', 'rebound', 'lungs', 'seated_plank',
  'figure4', 'chin_tucks', 'doorway_stretch', 'hamstring_sweep', 'leg_extension', 'desk_plank',
  'brugger', 'couch_stretch', 'clamshell', 'ceiling_reach', 'stroll', 'back_extension', 'cardio_burst'];

test('all 28 figure keys exist and are svg markup', () => {
  assertEqual(Object.keys(FIGURES).length, 28);
  for (const k of KEYS) {
    assert(k in FIGURES, `missing ${k}`);
    assert(FIGURES[k].trim().startsWith('<svg'), `${k} is not svg`);
  }
});

test('getFigure falls back to shoulders', () => {
  assertEqual(getFigure('no-such-key'), FIGURES.shoulders);
  assertEqual(getFigure('eyes'), FIGURES.eyes);
});

run();
