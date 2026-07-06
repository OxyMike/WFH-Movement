import { test, run } from './run.js';
import { resetAll, getTodayRecord, saveBodyStiffness } from '../storage.js';

const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

test('fresh today record has all-zero bodyStiffness for the five zones', () => {
  resetAll();
  const b = getTodayRecord().bodyStiffness;
  const keys = ['neck', 'shoulders', 'back', 'wrists', 'legs'];
  for (const k of keys) if (b[k] !== 0) throw new Error(`expected ${k}=0`);
  if (Object.keys(b).length !== 5) throw new Error('expected exactly 5 zones');
});

test('saveBodyStiffness sets one zone level and persists', () => {
  resetAll();
  saveBodyStiffness('back', 2);
  saveBodyStiffness('neck', 1);
  const b = getTodayRecord().bodyStiffness;
  if (b.back !== 2 || b.neck !== 1 || b.legs !== 0)
    throw new Error(`unexpected: ${JSON.stringify(b)}`);
});

run();
