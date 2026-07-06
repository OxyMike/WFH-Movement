import { test, run, assert, assertEqual } from './run.js';
import { WFH_HEALTH_FACTS } from '../facts.js';

test('10 facts, all non-empty strings', () => {
  assertEqual(WFH_HEALTH_FACTS.length, 10);
  for (const f of WFH_HEALTH_FACTS)
    assert(typeof f === 'string' && f.length > 0, 'empty fact');
});

test('every fact cites a source link', () => {
  for (const f of WFH_HEALTH_FACTS)
    assert(/href='https:\/\/\S+'/.test(f), `fact missing source: ${f.slice(0, 40)}`);
});

run();
