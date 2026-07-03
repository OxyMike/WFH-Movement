import { test, run, assert, assertEqual } from './run.js';
import { FIGURES, getFigure } from '../figures.js';

const KEYS = ['shoulders', 'neck', 'wrist', 'twist', 'legs', 'squats', 'pushups',
  'march', 'sidebend', 'eyes', 'calf', 'lunge', 'rebound', 'lungs', 'seated_plank',
  'figure4', 'chin_tucks', 'doorway_stretch', 'hamstring_sweep', 'leg_extension', 'desk_plank'];

test('all 21 figure keys exist and are svg markup', () => {
  assertEqual(Object.keys(FIGURES).length, 21);
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
