// tools/port-antigravity.mjs -- one-time extraction of quest content from the
// Antigravity example into exercises.js and figures.js. Delete after the merge.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('Frontendexampleantigravity/app.js', 'utf8');

function extract(name) {
  const declIdx = src.indexOf(`const ${name} =`);
  if (declIdx === -1) throw new Error(`${name} not found`);
  const openIdx = src.slice(declIdx).search(/[\[{]/) + declIdx;
  const open = src[openIdx];
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = null, i = openIdx;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) break;
  }
  return new Function(`return ${src.slice(openIdx, i + 1)};`)();
}

const TARGET_AREAS = {
  'posture-reset': 'shoulders', 'wrist-stretch': 'wrists', 'back-twist': 'core',
  'calf-raises': 'legs', 'seated-plank': 'core', 'eye-focus': 'neck',
  'shoulder-rolls': 'shoulders', 'deep-breaths': 'core', 'seated-spinal-twist': 'core',
  'figure-4-stretch': 'legs', 'chin-tucks': 'neck', 'wrist-extensor': 'wrists',
  'glute-squeezes': 'legs', 'scapular-retractions': 'shoulders', 'doorway-stretch': 'shoulders',
  'side-bends': 'core', 'hip-flexor-stretch': 'legs', 'hamstring-sweeps': 'legs',
  'sit-to-stand': 'legs', 'standing-calf-raises': 'legs', 'air-squats': 'legs',
  'leg-extensions': 'legs', 'desk-pushups': 'shoulders', 'stair-climbing': 'legs',
  'desk-plank': 'core', 'high-knees': 'legs', 'rebounding': 'legs', 'pacing': 'legs'
};

const library = extract('QUESTS_LIBRARY');
const stepTemplates = extract('STEP_TEMPLATES');
const svgs = extract('MOVEMENT_SVGS');

const quests = library.map(q => {
  const area = TARGET_AREAS[q.id];
  if (!area) throw new Error(`no target area for ${q.id}`);
  const steps = (stepTemplates[q.id] || stepTemplates.default).map(s => ({ ...s }));
  // Make step durations sum exactly to the quest duration by adjusting the last step.
  const want = q.duration * 60;
  const sum = steps.reduce((s, st) => s + st.duration, 0);
  steps[steps.length - 1].duration += want - sum;
  if (steps[steps.length - 1].duration <= 0) throw new Error(`${q.id}: step durations exceed quest duration`);
  return {
    id: q.id, name: q.name, category: q.category,
    tier: q.difficulty.toLowerCase(), xp: q.xp, duration: q.duration,
    targetArea: area, desc: q.desc, steps
  };
});

writeFileSync('exercises.js',
  '// exercises.js -- quest library ported from the Antigravity redesign (2026-07-03)\n' +
  '// See docs/superpowers/specs/2026-07-03-antigravity-ui-merge-design.md\n' +
  'export const EXERCISES = ' + JSON.stringify(quests, null, 2) + ';\n');

const figureEntries = Object.entries(svgs)
  .map(([k, v]) => `  ${k}: \`${v.replace(/`/g, '\\`')}\``).join(',\n');
writeFileSync('figures.js',
  '// figures.js -- 14 animated SVG movement archetypes from the Antigravity redesign\n' +
  `export const FIGURES = {\n${figureEntries}\n};\n\n` +
  'export function getFigure(key) {\n  return FIGURES[key] || FIGURES.shoulders;\n}\n');

console.log(`ported ${quests.length} quests, ${Object.keys(svgs).length} figures`);
