import { test, run } from './run.js';
import { resetAll, getTodayRecord, saveStiffAreas } from '../storage.js';

const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

test('fresh today record has empty stiffAreas', () => {
  resetAll();
  const rec = getTodayRecord();
  if (!Array.isArray(rec.stiffAreas) || rec.stiffAreas.length !== 0)
    throw new Error('expected stiffAreas []');
});

test('saveStiffAreas persists zones onto today record', () => {
  resetAll();
  saveStiffAreas(['neck', 'wrists']);
  const rec = getTodayRecord();
  if (rec.stiffAreas.join(',') !== 'neck,wrists')
    throw new Error(`expected neck,wrists got ${rec.stiffAreas}`);
});

run();
