# WFH Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static website that reminds WFH workers to take movement breaks throughout the day, guided by a PT-curated exercise library with a smart rotation engine, tiered timers, and educational content about the cost of prolonged sitting.

**Architecture:** Pure static site — HTML, CSS, vanilla JS — with no build step or dependencies. Application state lives in `localStorage`. A Service Worker handles background notifications when the tab is inactive, with an on-screen countdown as fallback. Logic-heavy modules (exercise rotation, storage, timer) are written as plain ES modules so they can be unit-tested with Node.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla ES modules, Web Notifications API, Service Worker API, localStorage, Web Audio API (tone generation), PWA manifest.

## Global Constraints

- No npm, no bundler, no framework — all JS is native ES modules loaded via `<script type="module">`
- All colors defined as CSS custom properties in `:root` — no hardcoded hex values in component styles
- localStorage key: `wfh-movement` (single JSON object, see spec for schema)
- Exercise `targetArea` values are exactly: `hips`, `spine`, `shoulders`, `neck`, `wrists`
- Quick break duration: 90 seconds. Full break duration: 300 seconds (shown as 5 min; user sees 5–10 min range in UI copy but timer runs 300s)
- App name in all UI copy: **WFH Movement**. Tagline: **Work For Health**
- No em dashes anywhere in UI copy
- Illustrations are SVG files in `illustrations/` directory

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Single page shell, all view containers, script/style imports |
| `style.css` | All styles; CSS custom properties for theme |
| `exercises.js` | Exercise library array, exported as `EXERCISES` |
| `storage.js` | localStorage read/write; settings, today, history |
| `rotation.js` | Exercise suggestion and rotation logic |
| `reminder.js` | Work window checks, interval/fixed schedule scheduling |
| `timer.js` | Countdown logic, audio tone generation |
| `app.js` | View management, event wiring, app entry point |
| `service-worker.js` | Background notification scheduling |
| `manifest.json` | PWA manifest |
| `illustrations/*.svg` | One SVG per exercise |
| `tests/rotation.test.js` | Node-runnable unit tests for rotation logic |
| `tests/storage.test.js` | Node-runnable unit tests for storage helpers |
| `tests/timer.test.js` | Node-runnable unit tests for timer helpers |
| `tests/run.js` | Minimal test runner (no dependencies) |

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `manifest.json`
- Create: `tests/run.js`

**Interfaces:**
- Produces: HTML view containers (`#view-onboarding`, `#view-dashboard`, `#view-timer`, `#view-settings`) used by all later tasks; CSS custom properties consumed by all later tasks.

- [ ] **Step 1: Create `tests/run.js` — zero-dependency test runner**

```javascript
// tests/run.js
let passed = 0, failed = 0;

export function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected)
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
```

- [ ] **Step 2: Create `manifest.json`**

```json
{
  "name": "WFH Movement",
  "short_name": "WFH Movement",
  "description": "Work For Health — movement reminders for people who work from home",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f7b6c",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Create placeholder icon directory**

```bash
mkdir icons
```

Create `icons/icon-192.png` and `icons/icon-512.png` as simple placeholder PNGs (can be updated with real icons later). For now, create a minimal 1x1 PNG file or use any image.

- [ ] **Step 4: Create `style.css`**

```css
/* style.css */
:root {
  --color-primary: #0f7b6c;
  --color-primary-dark: #0a5a4f;
  --color-accent: #f59e0b;
  --color-accent-dark: #d97706;
  --color-text: #1a1a1a;
  --color-text-muted: #6b7280;
  --color-bg: #ffffff;
  --color-bg-subtle: #f9fafb;
  --color-border: #e5e7eb;
  --color-danger: #dc2626;

  --font: system-ui, -apple-system, sans-serif;
  --radius: 8px;
  --radius-lg: 16px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.12);

  --transition: 0.2s ease;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
}

.view { display: none; }
.view.active { display: block; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  border: none;
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), transform var(--transition);
}
.btn:active { transform: scale(0.98); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-accent { background: var(--color-accent); color: white; }
.btn-accent:hover { background: var(--color-accent-dark); }
.btn-ghost { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-ghost:hover { background: var(--color-bg-subtle); }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
.btn-full { width: 100%; }

.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; }
h3 { font-size: 1.125rem; font-weight: 600; }

.text-muted { color: var(--color-text-muted); font-size: 0.875rem; }
.text-center { text-align: center; }

input[type="time"],
input[type="number"],
select {
  font-family: var(--font);
  font-size: 1rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  width: 100%;
}
input:focus, select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

label { font-weight: 600; font-size: 0.875rem; display: block; margin-bottom: 0.375rem; }
.form-group { margin-bottom: 1.25rem; }

.badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.badge-primary { background: var(--color-primary); color: white; border-color: transparent; }

/* Utility */
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.hidden { display: none !important; }
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WFH Movement — Work For Health</title>
  <link rel="stylesheet" href="style.css">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0f7b6c">
</head>
<body>

  <!-- Onboarding view -->
  <div id="view-onboarding" class="view">
    <div class="container" style="padding-top:3rem;padding-bottom:3rem;">
      <div class="text-center mt-4">
        <h1 style="color:var(--color-primary)">WFH Movement</h1>
        <p class="text-muted mt-2">Work For Health — movement breaks that actually fit your day</p>
      </div>
      <div class="card mt-8">
        <h2>Set up your day</h2>
        <p class="text-muted mt-2">Takes less than a minute. You can change any of this later.</p>

        <div class="form-group mt-6">
          <label for="work-start">Work day starts</label>
          <input type="time" id="work-start" value="08:00">
        </div>
        <div class="form-group">
          <label for="work-end">Work day ends</label>
          <input type="time" id="work-end" value="17:00">
        </div>

        <div class="form-group">
          <label>Reminder style</label>
          <select id="reminder-mode">
            <option value="interval">Every X minutes (recommended)</option>
            <option value="fixed">At specific times I choose</option>
          </select>
        </div>

        <div id="interval-options">
          <div class="form-group">
            <label for="interval-minutes">Remind me every</label>
            <select id="interval-minutes">
              <option value="30">30 minutes</option>
              <option value="45" selected>45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
        </div>

        <div id="fixed-options" class="hidden">
          <div class="form-group">
            <label>Reminder times (add up to 6)</label>
            <div id="fixed-times-list" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;"></div>
            <div style="display:flex;gap:0.5rem;">
              <input type="time" id="fixed-time-input" style="flex:1;">
              <button class="btn btn-ghost btn-sm" id="add-fixed-time">Add</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Default break length</label>
          <select id="default-break">
            <option value="quick">Quick (90 seconds)</option>
            <option value="full" selected>Full (5 minutes)</option>
          </select>
        </div>

        <button class="btn btn-primary btn-full mt-4" id="btn-complete-onboarding">
          Start moving
        </button>
      </div>
    </div>
  </div>

  <!-- Dashboard view -->
  <div id="view-dashboard" class="view">
    <header style="background:var(--color-primary);color:white;padding:1rem 0;">
      <div class="container flex justify-between items-center">
        <span style="font-weight:700;font-size:1.125rem;">WFH Movement</span>
        <button class="btn btn-ghost btn-sm" id="btn-open-settings"
          style="color:white;border-color:rgba(255,255,255,0.4);">Settings</button>
      </div>
    </header>

    <!-- Idle state -->
    <div id="dashboard-idle" class="container" style="padding-top:2rem;padding-bottom:2rem;">
      <div class="card text-center">
        <p class="text-muted">Next break in</p>
        <div id="next-break-countdown"
          style="font-size:3rem;font-weight:700;color:var(--color-primary);margin:0.5rem 0;">--:--</div>
        <p class="text-muted" id="next-break-label">Setting up your schedule...</p>
      </div>
      <div class="flex gap-4 mt-4">
        <div class="card text-center" style="flex:1;">
          <div style="font-size:2rem;font-weight:700;color:var(--color-primary);" id="stat-today">0</div>
          <p class="text-muted" style="font-size:0.8rem;">breaks today</p>
        </div>
        <div class="card text-center" style="flex:1;">
          <div style="font-size:2rem;font-weight:700;color:var(--color-accent);" id="stat-streak">0</div>
          <p class="text-muted" style="font-size:0.8rem;">day streak</p>
        </div>
      </div>
      <div class="card mt-4 text-center">
        <p class="text-muted" style="font-size:0.8rem;">Outside work hours? Take one now.</p>
        <button class="btn btn-ghost btn-sm mt-2" id="btn-take-break-now">Take a break now</button>
      </div>
    </div>

    <!-- Active break state (hidden until reminder fires) -->
    <div id="dashboard-active" class="hidden">
      <div style="background:var(--color-primary);color:white;padding:1.5rem 0;">
        <div class="container text-center">
          <p style="font-size:0.875rem;opacity:0.8;">Time to move</p>
          <h2 id="active-exercise-name" style="margin-top:0.25rem;">Hip Flexor Stretch</h2>
          <span class="badge" id="active-exercise-area"
            style="background:rgba(255,255,255,0.2);color:white;border:none;margin-top:0.5rem;">Hips</span>
        </div>
      </div>
      <div class="container" style="padding-top:1.5rem;padding-bottom:2rem;">
        <div class="card text-center">
          <div id="active-exercise-illustration"
            style="height:160px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);">
            <!-- SVG loaded dynamically -->
          </div>
          <p id="active-exercise-description" class="text-muted mt-4" style="font-size:0.9rem;"></p>
          <ul id="active-exercise-cues"
            style="text-align:left;margin-top:1rem;padding-left:1.25rem;display:flex;flex-direction:column;gap:0.375rem;"></ul>
        </div>

        <div class="flex gap-4 mt-4">
          <button class="btn btn-ghost btn-full" id="btn-start-quick">
            Quick<br><small style="font-weight:400;">90 seconds</small>
          </button>
          <button class="btn btn-accent btn-full" id="btn-start-full">
            Full break<br><small style="font-weight:400;">5 minutes</small>
          </button>
        </div>

        <div class="text-center mt-4">
          <button class="btn btn-ghost btn-sm" id="btn-swap-exercise">
            Show me something else
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Timer view -->
  <div id="view-timer" class="view"
    style="min-height:100vh;background:var(--color-primary);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;">
    <p id="timer-exercise-name" style="font-size:1rem;opacity:0.8;"></p>
    <div id="timer-countdown"
      style="font-size:6rem;font-weight:700;line-height:1;margin:1rem 0;font-variant-numeric:tabular-nums;">
      5:00
    </div>
    <div id="timer-progress-bar"
      style="width:100%;max-width:320px;height:6px;background:rgba(255,255,255,0.25);border-radius:3px;margin:1rem 0;">
      <div id="timer-progress-fill"
        style="height:100%;background:white;border-radius:3px;width:0%;transition:width 1s linear;"></div>
    </div>
    <ul id="timer-cues"
      style="list-style:none;margin-top:1rem;display:flex;flex-direction:column;gap:0.5rem;max-width:320px;opacity:0.9;">
    </ul>
    <button class="btn mt-8" id="btn-skip-timer"
      style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);">
      Skip
    </button>
  </div>

  <!-- Settings modal -->
  <div id="modal-settings" class="hidden"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center;padding:1rem;">
    <div class="card" style="width:100%;max-width:480px;max-height:90vh;overflow-y:auto;">
      <div class="flex justify-between items-center">
        <h2>Settings</h2>
        <button class="btn btn-ghost btn-sm" id="btn-close-settings">Close</button>
      </div>

      <div class="form-group mt-6">
        <label for="s-work-start">Work day starts</label>
        <input type="time" id="s-work-start">
      </div>
      <div class="form-group">
        <label for="s-work-end">Work day ends</label>
        <input type="time" id="s-work-end">
      </div>
      <div class="form-group">
        <label>Reminder style</label>
        <select id="s-reminder-mode">
          <option value="interval">Every X minutes</option>
          <option value="fixed">At specific times</option>
        </select>
      </div>
      <div id="s-interval-options">
        <div class="form-group">
          <label for="s-interval-minutes">Remind me every</label>
          <select id="s-interval-minutes">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>
      </div>
      <div id="s-fixed-options" class="hidden">
        <div class="form-group">
          <label>Reminder times</label>
          <div id="s-fixed-times-list" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;"></div>
          <div style="display:flex;gap:0.5rem;">
            <input type="time" id="s-fixed-time-input" style="flex:1;">
            <button class="btn btn-ghost btn-sm" id="s-add-fixed-time">Add</button>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Default break length</label>
        <select id="s-default-break">
          <option value="quick">Quick (90 seconds)</option>
          <option value="full">Full (5 minutes)</option>
        </select>
      </div>

      <button class="btn btn-primary btn-full mt-4" id="btn-save-settings">Save changes</button>

      <div style="border-top:1px solid var(--color-border);margin-top:2rem;padding-top:1.5rem;">
        <h3 style="color:var(--color-danger);">Reset</h3>
        <p class="text-muted mt-2" style="font-size:0.875rem;">
          Clears all your data including history and streak. Cannot be undone.
        </p>
        <button class="btn btn-sm mt-4" id="btn-reset-data"
          style="background:var(--color-danger);color:white;">Reset all data</button>
      </div>
    </div>
  </div>

  <!-- Educational section (always visible on scroll) -->
  <section id="section-why" style="background:var(--color-bg-subtle);padding:4rem 0;display:none;">
    <div class="container">
      <h2 class="text-center">Why this matters</h2>
      <p class="text-muted text-center mt-2">The research is clear, and it is not what most people expect.</p>

      <div style="display:grid;gap:1.5rem;margin-top:2.5rem;">
        <div class="card">
          <h3 style="color:var(--color-primary);">What happens in the next 60 minutes</h3>
          <ul style="margin-top:1rem;padding-left:1.25rem;display:flex;flex-direction:column;gap:0.5rem;color:var(--color-text-muted);font-size:0.9rem;">
            <li><strong style="color:var(--color-text);">Circulation drops 50%</strong> — blood pools in your lower legs within one hour of sitting</li>
            <li><strong style="color:var(--color-text);">Metabolism slows</strong> — your body enters an energy-saving mode and calorie burning drops significantly</li>
            <li><strong style="color:var(--color-text);">Fat-burning enzyme shuts off</strong> — lipoprotein lipase, which breaks down fats in your bloodstream, deactivates</li>
            <li><strong style="color:var(--color-text);">Insulin resistance begins</strong> — muscles stop contracting, reducing their ability to clear glucose from your blood</li>
            <li><strong style="color:var(--color-text);">Spinal compression increases</strong> — lumbar disc pressure is higher when seated than when standing or lying down</li>
          </ul>
        </div>

        <div class="card">
          <h3 style="color:var(--color-primary);">What accumulates over months and years</h3>
          <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.75rem;">
            <div style="padding:0.75rem;background:var(--color-bg-subtle);border-radius:var(--radius);font-size:0.875rem;">
              <strong>Cardiovascular</strong>
              <p class="text-muted mt-1">Stiffened arteries, plaque buildup, and a 54% higher risk of fatal heart attacks</p>
            </div>
            <div style="padding:0.75rem;background:var(--color-bg-subtle);border-radius:var(--radius);font-size:0.875rem;">
              <strong>Metabolic</strong>
              <p class="text-muted mt-1">Chronic high blood pressure, midsection weight gain, and Type 2 diabetes</p>
            </div>
            <div style="padding:0.75rem;background:var(--color-bg-subtle);border-radius:var(--radius);font-size:0.875rem;">
              <strong>Musculoskeletal</strong>
              <p class="text-muted mt-1">Gluteal muscle wasting, bone mineral loss, and early spinal disc degeneration</p>
            </div>
            <div style="padding:0.75rem;background:var(--color-bg-subtle);border-radius:var(--radius);font-size:0.875rem;">
              <strong>Vascular</strong>
              <p class="text-muted mt-1">Varicose veins and life-threatening Deep Vein Thrombosis blood clots</p>
            </div>
          </div>
        </div>

        <div class="card" style="border-color:var(--color-primary);">
          <h3 style="color:var(--color-primary);">Why your gym session is not enough</h3>
          <p class="text-muted mt-2" style="font-size:0.9rem;">
            Medical research shows that standard workouts at the end of the day cannot completely undo the damage of sitting all day. The damage happens in real time, hour by hour.
          </p>
          <p class="text-muted mt-2" style="font-size:0.9rem;">
            The solution is frequent micro-movement: stand up and move for just 2 to 5 minutes for every 30 to 60 minutes you spend seated. One minute of bodyweight movement restarts your metabolism and muscle glucose uptake immediately.
          </p>
          <p style="margin-top:1rem;font-weight:600;font-size:0.9rem;">
            This is exactly what WFH Movement is built for.
          </p>
        </div>
      </div>
    </div>
  </section>

  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 6: Verify the file opens in a browser**

Open `index.html` in a browser. Expected: blank white page with no console errors (all views are hidden, app.js doesn't exist yet so there will be a module load error — that's fine at this stage; confirm the HTML structure loaded correctly by inspecting the DOM).

- [ ] **Step 7: Commit**

```bash
git init
git add index.html style.css manifest.json tests/run.js
git commit -m "feat: project scaffold — HTML shell, CSS system, PWA manifest, test runner"
```

---

## Task 2: Exercise Library

**Files:**
- Create: `exercises.js`
- Create: `illustrations/*.svg` (placeholder SVGs for all 25 exercises)
- Create: `tests/exercises.test.js`

**Interfaces:**
- Produces: `EXERCISES` — array of exercise objects, exported from `exercises.js`. Shape:
  ```javascript
  {
    id: string,              // kebab-case, unique
    name: string,
    targetArea: 'hips' | 'spine' | 'shoulders' | 'neck' | 'wrists',
    description: string,
    cues: string[],          // exactly 2-3 items
    quickDuration: 90,       // always 90
    fullDuration: 300,       // always 300
    illustration: string     // filename, e.g. "hip-flexor-stretch.svg"
  }
  ```

- [ ] **Step 1: Write the failing test**

```javascript
// tests/exercises.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { EXERCISES } from '../exercises.js';

const VALID_AREAS = ['hips', 'spine', 'shoulders', 'neck', 'wrists'];

test('EXERCISES is a non-empty array', () => {
  assert(Array.isArray(EXERCISES), 'EXERCISES should be an array');
  assert(EXERCISES.length >= 20, `Should have at least 20 exercises, got ${EXERCISES.length}`);
});

test('each exercise has required fields', () => {
  for (const ex of EXERCISES) {
    assert(typeof ex.id === 'string' && ex.id.length > 0, `Exercise missing id: ${JSON.stringify(ex)}`);
    assert(typeof ex.name === 'string' && ex.name.length > 0, `Exercise missing name: ${ex.id}`);
    assert(VALID_AREAS.includes(ex.targetArea), `Invalid targetArea "${ex.targetArea}" on ${ex.id}`);
    assert(typeof ex.description === 'string' && ex.description.length > 0, `Exercise missing description: ${ex.id}`);
    assert(Array.isArray(ex.cues) && ex.cues.length >= 2 && ex.cues.length <= 3, `Exercise cues must be 2-3 items: ${ex.id}`);
    assertEqual(ex.quickDuration, 90, `quickDuration must be 90 on ${ex.id}`);
    assertEqual(ex.fullDuration, 300, `fullDuration must be 300 on ${ex.id}`);
    assert(typeof ex.illustration === 'string' && ex.illustration.endsWith('.svg'), `Invalid illustration on ${ex.id}`);
  }
});

test('all exercise ids are unique', () => {
  const ids = EXERCISES.map(e => e.id);
  const unique = new Set(ids);
  assertEqual(unique.size, ids.length, 'Duplicate exercise IDs found');
});

test('all five target areas are represented', () => {
  const areas = new Set(EXERCISES.map(e => e.targetArea));
  for (const area of VALID_AREAS) {
    assert(areas.has(area), `No exercises found for targetArea "${area}"`);
  }
});

summary();
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --experimental-vm-modules tests/exercises.test.js
```

Expected: FAIL — `Cannot find module '../exercises.js'`

- [ ] **Step 3: Create `exercises.js`**

```javascript
// exercises.js
export const EXERCISES = [
  // --- HIPS & GLUTES ---
  {
    id: 'hip-flexor-stretch',
    name: 'Hip Flexor Stretch',
    targetArea: 'hips',
    description: 'Lengthens the hip flexors that shorten and tighten from prolonged sitting.',
    cues: [
      'Lower into a lunge with your back knee on the floor',
      'Drive your hips forward — not your chest',
      'Keep your core braced and hold the tension without bouncing'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'hip-flexor-stretch.svg'
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    targetArea: 'hips',
    description: 'Reactivates the glutes, which become inhibited and weak from sitting all day.',
    cues: [
      'Lie on your back, feet flat, knees bent to 90 degrees',
      'Press through your heels to drive your hips toward the ceiling',
      'Squeeze your glutes hard at the top and hold for 2 seconds before lowering'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'glute-bridge.svg'
  },
  {
    id: 'figure-four-stretch',
    name: 'Standing Figure-Four',
    targetArea: 'hips',
    description: 'Opens the hip external rotators and stretches the piriformis, which compresses under prolonged sitting.',
    cues: [
      'Stand on one foot, cross the opposite ankle over your standing knee',
      'Sit back as if lowering into a chair — keep your chest up',
      'Use a wall for balance if needed; feel the stretch in the crossed leg hip'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'figure-four-stretch.svg'
  },
  {
    id: 'lateral-hip-circles',
    name: 'Lateral Hip Circles',
    targetArea: 'hips',
    description: 'Restores hip mobility through its full range of motion in all planes.',
    cues: [
      'Stand with feet shoulder-width apart and hands on your hips',
      'Draw slow, large circles with your hips — full rotation in both directions',
      'Keep your shoulders still; the movement comes entirely from the hips'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'lateral-hip-circles.svg'
  },

  // --- SPINE & CORE ---
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    targetArea: 'spine',
    description: 'Pumps synovial fluid through the spinal joints and counteracts the static compression of sitting.',
    cues: [
      'On hands and knees, align wrists under shoulders and knees under hips',
      'Inhale to arch (cow): lift your chest and tailbone toward the ceiling',
      'Exhale to round (cat): tuck your chin and tailbone, push the floor away'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'cat-cow.svg'
  },
  {
    id: 'thoracic-rotation',
    name: 'Thoracic Rotation',
    targetArea: 'spine',
    description: 'Restores mid-back rotation that is lost when you are locked in a forward-facing desk position.',
    cues: [
      'Sit on the edge of your chair, feet flat, hands behind your head',
      'Rotate your upper back to one side — lead with your elbow, not your shoulder',
      'Keep your hips square; the rotation happens at the mid-back, not the lower back'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'thoracic-rotation.svg'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    targetArea: 'spine',
    description: 'Trains deep core stability to support the lumbar spine against the load of sitting.',
    cues: [
      'Lie on your back, arms pointing at the ceiling, knees bent at 90 degrees in the air',
      'Slowly lower one arm and the opposite leg toward the floor — do not let your back arch',
      'Return to start and switch sides; breathe out on each extension'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'dead-bug.svg'
  },
  {
    id: 'standing-backbend',
    name: 'Standing Backbend',
    targetArea: 'spine',
    description: 'Decompresses the lumbar spine and counteracts the forward flexion posture of desk work.',
    cues: [
      'Stand tall, place your hands on your lower back with fingers pointing down',
      'Gently arch backward, looking up toward the ceiling — do not strain',
      'Hold 2 to 3 seconds, return to upright; this is a gentle extension, not a full backbend'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'standing-backbend.svg'
  },

  // --- SHOULDERS & CHEST ---
  {
    id: 'doorway-chest-opener',
    name: 'Doorway Chest Opener',
    targetArea: 'shoulders',
    description: 'Stretches the pectoral muscles that shorten and pull the shoulders forward at a desk.',
    cues: [
      'Stand in a doorway, place forearms on the frame at 90 degrees',
      'Step one foot through and gently lean forward until you feel a stretch across the chest',
      'Keep your chin tucked — do not let your head jut forward during the stretch'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'doorway-chest-opener.svg'
  },
  {
    id: 'shoulder-blade-squeeze',
    name: 'Shoulder Blade Squeeze',
    targetArea: 'shoulders',
    description: 'Activates the mid-trapezius and rhomboids, which become inhibited in the rounded-shoulder desk posture.',
    cues: [
      'Sit or stand tall, arms at your sides',
      'Squeeze your shoulder blades together and down — imagine tucking them into your back pockets',
      'Hold for 5 seconds, release fully, and repeat; do not shrug your shoulders upward'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'shoulder-blade-squeeze.svg'
  },
  {
    id: 'cross-body-shoulder-stretch',
    name: 'Cross-Body Shoulder Stretch',
    targetArea: 'shoulders',
    description: 'Releases the posterior shoulder capsule that tightens from sustained keyboard and mouse use.',
    cues: [
      'Bring one arm straight across your chest at shoulder height',
      'Use your opposite hand or forearm to gently press it toward your chest',
      'Keep your shoulder down — resist letting it creep up toward your ear'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'cross-body-shoulder-stretch.svg'
  },
  {
    id: 'overhead-reach',
    name: 'Overhead Reach',
    targetArea: 'shoulders',
    description: 'Restores full shoulder elevation and decompresses the thoracic spine simultaneously.',
    cues: [
      'Interlace your fingers and press your palms toward the ceiling',
      'Reach as high as you can, lengthening through your entire side body',
      'Take a deep breath in at the top — let your rib cage expand fully'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'overhead-reach.svg'
  },

  // --- NECK & UPPER TRAPS ---
  {
    id: 'chin-tucks',
    name: 'Chin Tucks',
    targetArea: 'neck',
    description: 'Corrects forward head posture (tech neck) by retraining the deep cervical flexors.',
    cues: [
      'Sit or stand tall, eyes forward',
      'Gently draw your chin straight back — as if making a double chin',
      'Hold 5 seconds; you should feel a light stretch at the base of the skull, not pain'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'chin-tucks.svg'
  },
  {
    id: 'lateral-neck-stretch',
    name: 'Lateral Neck Stretch',
    targetArea: 'neck',
    description: 'Releases the upper trapezius and scalene muscles that become chronically tight from screen tension.',
    cues: [
      'Sit tall, reach one hand under your thigh or hold the seat to anchor the shoulder down',
      'Tilt your ear toward the opposite shoulder — let gravity do the work',
      'Hold 20 to 30 seconds each side; do not force it further with your hand'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'lateral-neck-stretch.svg'
  },
  {
    id: 'levator-scapulae-stretch',
    name: 'Levator Scapulae Stretch',
    targetArea: 'neck',
    description: 'Targets the muscle running from the neck to the shoulder blade, a common source of desk-related neck pain.',
    cues: [
      'Sit tall, rotate your head 45 degrees to one side',
      'Tilt your chin down toward your armpit on that same side',
      'Use your hand on top of your head to add gentle weight — never force the stretch'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'levator-scapulae-stretch.svg'
  },
  {
    id: 'neck-rolls',
    name: 'Neck Rolls',
    targetArea: 'neck',
    description: 'Improves cervical mobility and releases accumulated tension from sustained screen time.',
    cues: [
      'Drop your chin to your chest and slowly roll your head to one shoulder',
      'Continue around in a full half-circle to the other shoulder — do not roll the head back',
      'Move slowly with your eyes closed; stop and breathe into any point of tension'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'neck-rolls.svg'
  },

  // --- WRISTS & FOREARMS ---
  {
    id: 'wrist-flexor-stretch',
    name: 'Wrist Flexor Stretch',
    targetArea: 'wrists',
    description: 'Lengthens the forearm flexors that tighten from hours of typing and mouse use.',
    cues: [
      'Extend one arm forward, palm up',
      'With your other hand, gently press the fingers back toward your body',
      'Hold 20 to 30 seconds; you should feel the stretch along the inner forearm'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-flexor-stretch.svg'
  },
  {
    id: 'wrist-extensor-stretch',
    name: 'Wrist Extensor Stretch',
    targetArea: 'wrists',
    description: 'Releases the forearm extensors, which are often overlooked but contribute to lateral elbow pain.',
    cues: [
      'Extend one arm forward, palm down, fingers pointing toward the floor',
      'With your other hand, gently press the back of your hand toward your body',
      'Hold 20 to 30 seconds; you should feel the stretch along the top of the forearm'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-extensor-stretch.svg'
  },
  {
    id: 'prayer-stretch',
    name: 'Prayer Stretch',
    targetArea: 'wrists',
    description: 'Stretches the wrist flexors bilaterally and gently loads the carpal tunnel structures.',
    cues: [
      'Press your palms together in front of your chest at heart height',
      'Slowly lower your hands toward your waist while keeping palms together',
      'Stop when you feel a stretch in your wrists and forearms; hold 20 to 30 seconds'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'prayer-stretch.svg'
  },
  {
    id: 'forearm-supination',
    name: 'Forearm Supination and Pronation',
    targetArea: 'wrists',
    description: 'Restores forearm rotation mobility that becomes restricted from sustained keyboard posture.',
    cues: [
      'Hold your elbow at 90 degrees at your side, upper arm against your ribcage',
      'Rotate your palm slowly all the way up, then all the way down',
      'Keep the upper arm still — the movement comes from the forearm, not the shoulder'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'forearm-supination.svg'
  },

  // --- BONUS (brings total to 21) ---
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    targetArea: 'hips',
    description: 'Activates the calf muscle pump to push pooled blood back up from the lower legs.',
    cues: [
      'Stand with feet hip-width apart, holding a wall or desk for light balance',
      'Rise onto the balls of your feet as high as you can go',
      'Lower slowly — take 3 seconds on the way down to maximize the pumping effect'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'calf-raises.svg'
  },
  {
    id: 'seated-spinal-twist',
    name: 'Seated Spinal Twist',
    targetArea: 'spine',
    description: 'Restores rotational mobility to the lumbar and thoracic spine without leaving your chair.',
    cues: [
      'Sit tall at the front of your chair, feet flat on the floor',
      'Place your right hand on your left knee, left hand on the back of the chair',
      'Rotate through your entire spine on the exhale — hold 20 to 30 seconds and switch sides'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'seated-spinal-twist.svg'
  },
  {
    id: 'wall-angels',
    name: 'Wall Angels',
    targetArea: 'shoulders',
    description: 'Trains the shoulder blades to move correctly and restores thoracic extension against gravity.',
    cues: [
      'Stand with your back flat against a wall, feet 6 inches out, low back gently pressed in',
      'Press the backs of your hands and forearms to the wall at 90 degrees',
      'Slowly slide your arms up and overhead — keep the entire arm in contact with the wall throughout'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wall-angels.svg'
  },
  {
    id: 'wrist-circles',
    name: 'Wrist Circles',
    targetArea: 'wrists',
    description: 'Maintains full wrist mobility and lubricates the joint after sustained static gripping.',
    cues: [
      'Extend both arms forward, hands loosely fisted',
      'Draw slow, large circles with both wrists simultaneously — 10 each direction',
      'Move through the full range; you may feel some light cracking, which is normal'
    ],
    quickDuration: 90,
    fullDuration: 300,
    illustration: 'wrist-circles.svg'
  }
];
```

- [ ] **Step 4: Create placeholder SVG illustrations**

Create a placeholder SVG for each exercise. All 21 illustrations should exist even if they are simple placeholders. Create `illustrations/` directory and run this to generate all placeholder SVGs:

For each exercise id, create `illustrations/<id>.svg` with this content (replacing EXERCISE NAME with the exercise name):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" fill="none">
  <rect width="200" height="160" rx="8" fill="#f3f4f6"/>
  <circle cx="100" cy="60" r="20" fill="#d1d5db"/>
  <rect x="80" y="88" width="40" height="50" rx="4" fill="#d1d5db"/>
  <text x="100" y="152" font-family="system-ui" font-size="10" fill="#9ca3af" text-anchor="middle">EXERCISE NAME</text>
</svg>
```

You need one file per exercise id:
`hip-flexor-stretch.svg`, `glute-bridge.svg`, `figure-four-stretch.svg`, `lateral-hip-circles.svg`, `cat-cow.svg`, `thoracic-rotation.svg`, `dead-bug.svg`, `standing-backbend.svg`, `doorway-chest-opener.svg`, `shoulder-blade-squeeze.svg`, `cross-body-shoulder-stretch.svg`, `overhead-reach.svg`, `chin-tucks.svg`, `lateral-neck-stretch.svg`, `levator-scapulae-stretch.svg`, `neck-rolls.svg`, `wrist-flexor-stretch.svg`, `wrist-extensor-stretch.svg`, `prayer-stretch.svg`, `forearm-supination.svg`, `calf-raises.svg`, `seated-spinal-twist.svg`, `wall-angels.svg`, `wrist-circles.svg`

- [ ] **Step 5: Run tests to verify they pass**

```bash
node --experimental-vm-modules tests/exercises.test.js
```

Expected output:
```
  PASS  EXERCISES is a non-empty array
  PASS  each exercise has required fields
  PASS  all exercise ids are unique
  PASS  all five target areas are represented

4 passed, 0 failed
```

- [ ] **Step 6: Commit**

```bash
git add exercises.js illustrations/ tests/exercises.test.js
git commit -m "feat: exercise library — 24 PT-curated exercises across 5 target areas"
```

---

## Task 3: Storage Module

**Files:**
- Create: `storage.js`
- Create: `tests/storage.test.js`

**Interfaces:**
- Produces:
  ```javascript
  // All exported from storage.js
  getState()                    // returns full state object or null
  saveState(state)              // writes full state to localStorage
  getSettings()                 // returns settings object with defaults
  saveSettings(settings)        // merges settings, writes state
  getTodayRecord()              // returns today's record {date, completedBreaks, lastTargetArea}
  logBreak(exerciseId, targetArea) // appends break to today, updates streak
  getStreak()                   // returns { streak: number, totalBreaks: number }
  resetAll()                    // clears localStorage key
  isFirstVisit()                // returns true if no state exists
  ```

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/storage.test.js
import { test, assert, assertEqual, summary } from './run.js';

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

// Clear store before each test by re-importing won't work cleanly,
// so we expose resetAll and call it between tests.
import {
  getSettings, saveSettings, getTodayRecord, logBreak,
  getStreak, resetAll, isFirstVisit
} from '../storage.js';

test('isFirstVisit returns true when no data exists', () => {
  resetAll();
  assert(isFirstVisit() === true, 'Should be first visit on clean state');
});

test('isFirstVisit returns false after settings are saved', () => {
  resetAll();
  saveSettings({ workStart: '09:00', workEnd: '17:00', reminderMode: 'interval', intervalMinutes: 45, fixedTimes: [], defaultBreakLength: 'full' });
  assert(isFirstVisit() === false, 'Should not be first visit after settings saved');
});

test('getSettings returns defaults when nothing saved', () => {
  resetAll();
  const s = getSettings();
  assertEqual(s.workStart, '08:00', 'Default workStart');
  assertEqual(s.workEnd, '17:00', 'Default workEnd');
  assertEqual(s.reminderMode, 'interval', 'Default reminderMode');
  assertEqual(s.intervalMinutes, 45, 'Default intervalMinutes');
  assertEqual(s.defaultBreakLength, 'full', 'Default defaultBreakLength');
});

test('saveSettings and getSettings round-trip', () => {
  resetAll();
  saveSettings({ workStart: '09:00', workEnd: '18:00', reminderMode: 'fixed', intervalMinutes: 60, fixedTimes: ['10:00', '14:00'], defaultBreakLength: 'quick' });
  const s = getSettings();
  assertEqual(s.workStart, '09:00');
  assertEqual(s.reminderMode, 'fixed');
  assertEqual(s.fixedTimes.length, 2);
});

test('getTodayRecord returns empty record for today', () => {
  resetAll();
  const record = getTodayRecord();
  assert(Array.isArray(record.completedBreaks), 'completedBreaks should be array');
  assertEqual(record.completedBreaks.length, 0, 'Should start empty');
  assert(record.lastTargetArea === null, 'lastTargetArea should be null');
});

test('logBreak appends to today record', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  const record = getTodayRecord();
  assertEqual(record.completedBreaks.length, 1);
  assertEqual(record.completedBreaks[0].exerciseId, 'hip-flexor-stretch');
  assertEqual(record.lastTargetArea, 'hips');
});

test('logBreak increments totalBreaks', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  logBreak('cat-cow', 'spine');
  assertEqual(getStreak().totalBreaks, 2);
});

test('resetAll clears all data', () => {
  resetAll();
  logBreak('hip-flexor-stretch', 'hips');
  resetAll();
  assert(isFirstVisit() === true, 'Should be first visit after reset');
  assertEqual(getTodayRecord().completedBreaks.length, 0);
});

summary();
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules tests/storage.test.js
```

Expected: FAIL — `Cannot find module '../storage.js'`

- [ ] **Step 3: Create `storage.js`**

```javascript
// storage.js
const KEY = 'wfh-movement';

const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full'
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getState() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isFirstVisit() {
  return getState() === null;
}

export function getSettings() {
  const state = getState();
  return state ? { ...DEFAULT_SETTINGS, ...state.settings } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  const state = getState() ?? {};
  saveState({ ...state, settings: { ...DEFAULT_SETTINGS, ...settings } });
}

export function getTodayRecord() {
  const state = getState();
  const today = todayString();
  if (!state || !state.today || state.today.date !== today) {
    return { date: today, completedBreaks: [], lastTargetArea: null };
  }
  return state.today;
}

export function logBreak(exerciseId, targetArea) {
  const state = getState() ?? {};
  const today = getTodayRecord();
  const history = state.history ?? { streak: 0, totalBreaks: 0, lastActiveDate: null };

  today.completedBreaks.push({
    exerciseId,
    targetArea,
    completedAt: new Date().toISOString()
  });
  today.lastTargetArea = targetArea;

  // Update streak
  const todayStr = todayString();
  if (history.lastActiveDate === todayStr) {
    // Already counted today
  } else if (history.lastActiveDate === previousDay(todayStr)) {
    history.streak += 1;
  } else {
    history.streak = 1;
  }
  history.lastActiveDate = todayStr;
  history.totalBreaks = (history.totalBreaks || 0) + 1;

  saveState({ ...state, today, history });
}

export function getStreak() {
  const state = getState();
  return state?.history ?? { streak: 0, totalBreaks: 0 };
}

export function resetAll() {
  localStorage.removeItem(KEY);
}

function previousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules tests/storage.test.js
```

Expected output:
```
  PASS  isFirstVisit returns true when no data exists
  PASS  isFirstVisit returns false after settings are saved
  PASS  getSettings returns defaults when nothing saved
  PASS  saveSettings and getSettings round-trip
  PASS  getTodayRecord returns empty record for today
  PASS  logBreak appends to today record
  PASS  logBreak increments totalBreaks
  PASS  resetAll clears all data

8 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/storage.test.js
git commit -m "feat: storage module — localStorage read/write with streak tracking"
```

---

## Task 4: Exercise Rotation Module

**Files:**
- Create: `rotation.js`
- Create: `tests/rotation.test.js`

**Interfaces:**
- Consumes: `EXERCISES` from `exercises.js` (array of exercise objects with `id`, `targetArea`)
- Produces:
  ```javascript
  suggestExercise(lastTargetArea, excludeId)
  // lastTargetArea: string|null — the area just completed; avoid repeating it
  // excludeId: string|null — exclude this exercise (used by swap)
  // returns: exercise object from EXERCISES
  ```

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/rotation.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { suggestExercise } from '../rotation.js';
import { EXERCISES } from '../exercises.js';

test('suggestExercise returns a valid exercise', () => {
  const result = suggestExercise(null, null);
  assert(result && typeof result.id === 'string', 'Should return an exercise object');
  assert(EXERCISES.find(e => e.id === result.id), 'Returned exercise should exist in EXERCISES');
});

test('suggestExercise avoids the last target area when other areas are available', () => {
  // Run 50 times to catch randomness issues
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('hips', null);
    assert(result.targetArea !== 'hips', `Should not repeat 'hips', got ${result.targetArea} on attempt ${i}`);
  }
});

test('suggestExercise falls back to any area if all others are exhausted (edge case)', () => {
  // When lastTargetArea is provided but only one area exists in the library,
  // it should still return something rather than crash.
  // We simulate by passing a valid area — function must always return an exercise.
  const result = suggestExercise('wrists', null);
  assert(result !== null && result !== undefined, 'Should always return an exercise');
});

test('suggestExercise excludes the given exerciseId (swap mechanic)', () => {
  const first = suggestExercise(null, null);
  // Run 50 times to ensure the excluded ID never comes back
  for (let i = 0; i < 50; i++) {
    const swapped = suggestExercise(null, first.id);
    assert(swapped.id !== first.id, `Excluded exercise ${first.id} should not be returned`);
  }
});

test('suggestExercise with both lastTargetArea and excludeId satisfies both constraints', () => {
  const excluded = EXERCISES.find(e => e.targetArea === 'spine');
  for (let i = 0; i < 50; i++) {
    const result = suggestExercise('spine', excluded.id);
    assert(result.targetArea !== 'spine', 'Should avoid spine area');
    assert(result.id !== excluded.id, 'Should avoid excluded exercise');
  }
});

summary();
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules tests/rotation.test.js
```

Expected: FAIL — `Cannot find module '../rotation.js'`

- [ ] **Step 3: Create `rotation.js`**

```javascript
// rotation.js
import { EXERCISES } from './exercises.js';

export function suggestExercise(lastTargetArea, excludeId) {
  // Filter by area preference first
  let pool = lastTargetArea
    ? EXERCISES.filter(e => e.targetArea !== lastTargetArea)
    : [...EXERCISES];

  // If filtering leaves nothing (shouldn't happen with 5 areas, but guard it)
  if (pool.length === 0) pool = [...EXERCISES];

  // Remove excluded exercise (swap mechanic)
  if (excludeId) pool = pool.filter(e => e.id !== excludeId);

  // If excluding leaves nothing, allow all except area restriction
  if (pool.length === 0) {
    pool = lastTargetArea
      ? EXERCISES.filter(e => e.targetArea !== lastTargetArea)
      : [...EXERCISES];
  }

  // If still nothing (extreme edge case), use full library
  if (pool.length === 0) pool = [...EXERCISES];

  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules tests/rotation.test.js
```

Expected output:
```
  PASS  suggestExercise returns a valid exercise
  PASS  suggestExercise avoids the last target area when other areas are available
  PASS  suggestExercise falls back to any area if all others are exhausted (edge case)
  PASS  suggestExercise excludes the given exerciseId (swap mechanic)
  PASS  suggestExercise with both lastTargetArea and excludeId satisfies both constraints

5 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add rotation.js tests/rotation.test.js
git commit -m "feat: rotation module — smart exercise suggestion avoiding repeated target areas"
```

---

## Task 5: Timer Module

**Files:**
- Create: `timer.js`
- Create: `tests/timer.test.js`

**Interfaces:**
- Produces:
  ```javascript
  startTimer(durationSeconds, onTick, onComplete)
  // durationSeconds: number
  // onTick(secondsRemaining, progressFraction) — called every second
  // onComplete() — called when timer reaches 0
  // returns: { stop: () => void }

  playTone(frequency, durationMs)
  // Plays a tone using Web Audio API; safe to call in Node (no-op if AudioContext unavailable)

  formatTime(seconds)
  // returns: "M:SS" string, e.g. 90 => "1:30", 65 => "1:05"
  ```

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/timer.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { formatTime } from '../timer.js';

// Note: startTimer and playTone use browser APIs not available in Node.
// We test only the pure helper formatTime here; timer integration is
// verified manually in the browser in Task 7.

test('formatTime formats 0 seconds', () => {
  assertEqual(formatTime(0), '0:00');
});

test('formatTime formats 90 seconds', () => {
  assertEqual(formatTime(90), '1:30');
});

test('formatTime formats 300 seconds', () => {
  assertEqual(formatTime(300), '5:00');
});

test('formatTime formats 65 seconds', () => {
  assertEqual(formatTime(65), '1:05');
});

test('formatTime formats 9 seconds', () => {
  assertEqual(formatTime(9), '0:09');
});

test('formatTime formats 3600 seconds', () => {
  assertEqual(formatTime(3600), '60:00');
});

summary();
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules tests/timer.test.js
```

Expected: FAIL — `Cannot find module '../timer.js'`

- [ ] **Step 3: Create `timer.js`**

```javascript
// timer.js
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function startTimer(durationSeconds, onTick, onComplete) {
  let remaining = durationSeconds;
  onTick(remaining, 0);

  const id = setInterval(() => {
    remaining -= 1;
    const progress = (durationSeconds - remaining) / durationSeconds;
    onTick(remaining, progress);

    if (remaining <= 0) {
      clearInterval(id);
      onComplete();
    }
  }, 1000);

  return { stop: () => clearInterval(id) };
}

export function playTone(frequency = 440, durationMs = 200) {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
  const ctx = new (AudioContext || webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationMs / 1000);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules tests/timer.test.js
```

Expected output:
```
  PASS  formatTime formats 0 seconds
  PASS  formatTime formats 90 seconds
  PASS  formatTime formats 300 seconds
  PASS  formatTime formats 65 seconds
  PASS  formatTime formats 9 seconds
  PASS  formatTime formats 3600 seconds

6 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add timer.js tests/timer.test.js
git commit -m "feat: timer module — countdown, audio tone, time formatting"
```

---

## Task 6: Reminder Engine

**Files:**
- Create: `reminder.js`
- Create: `tests/reminder.test.js`

**Interfaces:**
- Consumes: `getSettings()` from `storage.js`
- Produces:
  ```javascript
  isWithinWorkWindow(settings, now)
  // settings: from getSettings()
  // now: Date object (injectable for testing)
  // returns: boolean

  getNextReminderMs(settings, now)
  // returns milliseconds until the next reminder should fire, or null if outside work window
  // For interval mode: ms until next interval boundary from work start
  // For fixed mode: ms until the next fixed time today, or null if all have passed

  startReminderEngine(onReminder)
  // Starts the reminder loop. Calls onReminder() when it's time for a break.
  // Returns: { stop: () => void }
  ```

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/reminder.test.js
import { test, assert, assertEqual, summary } from './run.js';
import { isWithinWorkWindow, getNextReminderMs } from '../reminder.js';

const baseSettings = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full'
};

function makeDate(timeStr) {
  // e.g. '09:30' => Date object for today at that time
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

test('isWithinWorkWindow: inside window returns true', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('10:00')) === true);
});

test('isWithinWorkWindow: before window returns false', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('07:59')) === false);
});

test('isWithinWorkWindow: after window returns false', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('17:01')) === false);
});

test('isWithinWorkWindow: exactly at start returns true', () => {
  assert(isWithinWorkWindow(baseSettings, makeDate('08:00')) === true);
});

test('getNextReminderMs interval mode: returns positive ms when inside window', () => {
  const ms = getNextReminderMs(baseSettings, makeDate('09:00'));
  assert(typeof ms === 'number' && ms > 0, `Expected positive ms, got ${ms}`);
  assert(ms <= 45 * 60 * 1000, `Should be at most 45 minutes, got ${ms}`);
});

test('getNextReminderMs interval mode: returns null outside window', () => {
  const ms = getNextReminderMs(baseSettings, makeDate('18:00'));
  assertEqual(ms, null, 'Should return null outside work window');
});

test('getNextReminderMs fixed mode: returns ms to next fixed time', () => {
  const settings = { ...baseSettings, reminderMode: 'fixed', fixedTimes: ['10:00', '14:00'] };
  const ms = getNextReminderMs(settings, makeDate('09:30'));
  assert(typeof ms === 'number' && ms > 0);
  // 09:30 to 10:00 = 30 minutes
  const expected = 30 * 60 * 1000;
  assert(Math.abs(ms - expected) < 2000, `Expected ~30min, got ${ms}ms`);
});

test('getNextReminderMs fixed mode: returns null when all times have passed', () => {
  const settings = { ...baseSettings, reminderMode: 'fixed', fixedTimes: ['09:00', '10:00'] };
  const ms = getNextReminderMs(settings, makeDate('11:00'));
  assertEqual(ms, null, 'Should return null when all fixed times passed');
});

summary();
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules tests/reminder.test.js
```

Expected: FAIL — `Cannot find module '../reminder.js'`

- [ ] **Step 3: Create `reminder.js`**

```javascript
// reminder.js
import { getSettings } from './storage.js';

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinWorkWindow(settings, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(settings.workStart);
  const endMinutes = timeToMinutes(settings.workEnd);
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function getNextReminderMs(settings, now = new Date()) {
  if (!isWithinWorkWindow(settings, now)) return null;

  const currentMs = now.getTime();

  if (settings.reminderMode === 'fixed') {
    const todayTimes = settings.fixedTimes.map(t => {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }).filter(t => t > currentMs);

    if (todayTimes.length === 0) return null;
    return Math.min(...todayTimes) - currentMs;
  }

  // Interval mode: find the next interval boundary from work start
  const startOfDay = new Date(now);
  const [sh, sm] = settings.workStart.split(':').map(Number);
  startOfDay.setHours(sh, sm, 0, 0);
  const msFromStart = currentMs - startOfDay.getTime();
  const intervalMs = settings.intervalMinutes * 60 * 1000;
  const msUntilNext = intervalMs - (msFromStart % intervalMs);
  return msUntilNext;
}

export function startReminderEngine(onReminder) {
  let timeoutId = null;

  function schedule() {
    const settings = getSettings();
    const ms = getNextReminderMs(settings);

    if (ms === null) {
      // Outside work window — check again in 60 seconds
      timeoutId = setTimeout(schedule, 60 * 1000);
      return;
    }

    timeoutId = setTimeout(() => {
      onReminder();
      schedule(); // reschedule after firing
    }, ms);
  }

  schedule();
  return { stop: () => clearTimeout(timeoutId) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules tests/reminder.test.js
```

Expected output:
```
  PASS  isWithinWorkWindow: inside window returns true
  PASS  isWithinWorkWindow: before window returns false
  PASS  isWithinWorkWindow: after window returns false
  PASS  isWithinWorkWindow: exactly at start returns true
  PASS  getNextReminderMs interval mode: returns positive ms when inside window
  PASS  getNextReminderMs interval mode: returns null outside window
  PASS  getNextReminderMs fixed mode: returns ms to next fixed time
  PASS  getNextReminderMs fixed mode: returns null when all times have passed

8 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add reminder.js tests/reminder.test.js
git commit -m "feat: reminder engine — interval and fixed-schedule modes with work window"
```

---

## Task 7: App Entry Point and View Management

**Files:**
- Create: `app.js`

**Interfaces:**
- Consumes: all modules — `storage.js`, `rotation.js`, `reminder.js`, `timer.js`, `exercises.js`
- Produces: the running application. No exports (entry point only).

- [ ] **Step 1: Create `app.js`**

```javascript
// app.js
import { EXERCISES } from './exercises.js';
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit } from './storage.js';
import { suggestExercise } from './rotation.js';
import { startReminderEngine, isWithinWorkWindow } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';

// --- State ---
let currentExercise = null;
let activeTimer = null;
let reminderEngine = null;
let countdownInterval = null;

// --- View Management ---
const views = {
  onboarding: document.getElementById('view-onboarding'),
  dashboard: document.getElementById('view-dashboard'),
  timer: document.getElementById('view-timer'),
};
const whySection = document.getElementById('section-why');

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
  if (name === 'dashboard') {
    whySection.style.display = 'block';
  } else {
    whySection.style.display = 'none';
  }
}

// --- Onboarding ---
const reminderModeSelect = document.getElementById('reminder-mode');
const intervalOptions = document.getElementById('interval-options');
const fixedOptions = document.getElementById('fixed-options');
const fixedTimesList = document.getElementById('fixed-times-list');
const fixedTimeInput = document.getElementById('fixed-time-input');
let onboardingFixedTimes = [];

reminderModeSelect.addEventListener('change', () => {
  const mode = reminderModeSelect.value;
  intervalOptions.classList.toggle('hidden', mode !== 'interval');
  fixedOptions.classList.toggle('hidden', mode !== 'fixed');
});

document.getElementById('add-fixed-time').addEventListener('click', () => {
  const val = fixedTimeInput.value;
  if (!val || onboardingFixedTimes.includes(val) || onboardingFixedTimes.length >= 6) return;
  onboardingFixedTimes.push(val);
  renderFixedTimes(fixedTimesList, onboardingFixedTimes, () => renderFixedTimes(fixedTimesList, onboardingFixedTimes));
  fixedTimeInput.value = '';
});

function renderFixedTimes(container, times, onChange) {
  container.innerHTML = '';
  times.forEach((t, i) => {
    const chip = document.createElement('span');
    chip.className = 'badge';
    chip.style.cursor = 'pointer';
    chip.textContent = `${t} ×`;
    chip.addEventListener('click', () => {
      times.splice(i, 1);
      if (onChange) onChange();
    });
    container.appendChild(chip);
  });
}

document.getElementById('btn-complete-onboarding').addEventListener('click', () => {
  const settings = {
    workStart: document.getElementById('work-start').value,
    workEnd: document.getElementById('work-end').value,
    reminderMode: reminderModeSelect.value,
    intervalMinutes: parseInt(document.getElementById('interval-minutes').value, 10),
    fixedTimes: [...onboardingFixedTimes],
    defaultBreakLength: document.getElementById('default-break').value,
  };
  saveSettings(settings);
  requestNotificationPermission();
  startApp();
});

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// --- Dashboard ---
function startApp() {
  showView('dashboard');
  updateDashboardStats();
  startCountdownDisplay();

  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
}

function updateDashboardStats() {
  const today = getTodayRecord();
  const { streak } = getStreak();
  document.getElementById('stat-today').textContent = today.completedBreaks.length;
  document.getElementById('stat-streak').textContent = streak;
}

function startCountdownDisplay() {
  if (countdownInterval) clearInterval(countdownInterval);
  updateCountdownDisplay();
  countdownInterval = setInterval(updateCountdownDisplay, 10000);
}

function updateCountdownDisplay() {
  const settings = getSettings();
  const { getNextReminderMs, isWithinWorkWindow: inWindow } = { getNextReminderMs: null, isWithinWorkWindow: null };

  import('./reminder.js').then(({ getNextReminderMs, isWithinWorkWindow }) => {
    const now = new Date();
    if (!isWithinWorkWindow(settings, now)) {
      document.getElementById('next-break-countdown').textContent = '--:--';
      document.getElementById('next-break-label').textContent = 'Outside work hours';
      return;
    }
    const ms = getNextReminderMs(settings, now);
    if (ms === null) {
      document.getElementById('next-break-countdown').textContent = '--:--';
      document.getElementById('next-break-label').textContent = 'No reminders scheduled';
      return;
    }
    document.getElementById('next-break-countdown').textContent = formatTime(Math.ceil(ms / 1000));
    document.getElementById('next-break-label').textContent = 'until next movement break';
  });
}

// --- Break flow ---
function triggerBreak() {
  const today = getTodayRecord();
  currentExercise = suggestExercise(today.lastTargetArea, null);
  showBreakPrompt(currentExercise);
}

function showBreakPrompt(exercise) {
  document.getElementById('dashboard-idle').classList.add('hidden');
  document.getElementById('dashboard-active').classList.remove('hidden');

  document.getElementById('active-exercise-name').textContent = exercise.name;
  document.getElementById('active-exercise-area').textContent = capitalize(exercise.targetArea);
  document.getElementById('active-exercise-description').textContent = exercise.description;

  const cuesList = document.getElementById('active-exercise-cues');
  cuesList.innerHTML = exercise.cues.map(c => `<li>${c}</li>`).join('');

  const illEl = document.getElementById('active-exercise-illustration');
  illEl.innerHTML = `<img src="illustrations/${exercise.illustration}" alt="${exercise.name}" style="max-height:140px;max-width:100%;">`;
}

function hideBreakPrompt() {
  document.getElementById('dashboard-idle').classList.remove('hidden');
  document.getElementById('dashboard-active').classList.add('hidden');
}

document.getElementById('btn-start-quick').addEventListener('click', () => {
  launchTimer(currentExercise, 90);
});

document.getElementById('btn-start-full').addEventListener('click', () => {
  launchTimer(currentExercise, 300);
});

document.getElementById('btn-swap-exercise').addEventListener('click', () => {
  const today = getTodayRecord();
  currentExercise = suggestExercise(today.lastTargetArea, currentExercise.id);
  showBreakPrompt(currentExercise);
});

document.getElementById('btn-take-break-now').addEventListener('click', () => {
  triggerBreak();
});

// --- Timer ---
function launchTimer(exercise, durationSeconds) {
  showView('timer');
  document.getElementById('timer-exercise-name').textContent = exercise.name;

  const cuesList = document.getElementById('timer-cues');
  cuesList.innerHTML = exercise.cues.map(c => `<li>${c}</li>`).join('');

  if (activeTimer) activeTimer.stop();

  const halfwayFired = { done: false };

  activeTimer = startTimer(
    durationSeconds,
    (remaining, progress) => {
      document.getElementById('timer-countdown').textContent = formatTime(remaining);
      document.getElementById('timer-progress-fill').style.width = `${progress * 100}%`;

      if (!halfwayFired.done && progress >= 0.5) {
        halfwayFired.done = true;
        playTone(523, 150); // C5
      }
    },
    () => {
      playTone(659, 300); // E5
      setTimeout(() => playTone(784, 400), 350); // G5
      completeBreak(exercise);
    }
  );
}

document.getElementById('btn-skip-timer').addEventListener('click', () => {
  if (activeTimer) activeTimer.stop();
  completeBreak(currentExercise);
});

function completeBreak(exercise) {
  logBreak(exercise.id, exercise.targetArea);
  showView('dashboard');
  hideBreakPrompt();
  updateDashboardStats();
  startCountdownDisplay();
}

// --- Settings ---
const settingsModal = document.getElementById('modal-settings');
let settingsFixedTimes = [];

document.getElementById('btn-open-settings').addEventListener('click', () => {
  openSettings();
});

document.getElementById('btn-close-settings').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
  const settings = {
    workStart: document.getElementById('s-work-start').value,
    workEnd: document.getElementById('s-work-end').value,
    reminderMode: document.getElementById('s-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('s-interval-minutes').value, 10),
    fixedTimes: [...settingsFixedTimes],
    defaultBreakLength: document.getElementById('s-default-break').value,
  };
  saveSettings(settings);
  settingsModal.classList.add('hidden');

  // Restart reminder engine with new settings
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
  startCountdownDisplay();
});

document.getElementById('s-reminder-mode').addEventListener('change', () => {
  const mode = document.getElementById('s-reminder-mode').value;
  document.getElementById('s-interval-options').classList.toggle('hidden', mode !== 'interval');
  document.getElementById('s-fixed-options').classList.toggle('hidden', mode !== 'fixed');
});

document.getElementById('s-add-fixed-time').addEventListener('click', () => {
  const val = document.getElementById('s-fixed-time-input').value;
  if (!val || settingsFixedTimes.includes(val) || settingsFixedTimes.length >= 6) return;
  settingsFixedTimes.push(val);
  renderFixedTimes(document.getElementById('s-fixed-times-list'), settingsFixedTimes, () =>
    renderFixedTimes(document.getElementById('s-fixed-times-list'), settingsFixedTimes));
  document.getElementById('s-fixed-time-input').value = '';
});

document.getElementById('btn-reset-data').addEventListener('click', () => {
  if (!confirm('This will clear all your data including your streak and history. Are you sure?')) return;
  resetAll();
  if (reminderEngine) reminderEngine.stop();
  location.reload();
});

function openSettings() {
  const s = getSettings();
  document.getElementById('s-work-start').value = s.workStart;
  document.getElementById('s-work-end').value = s.workEnd;
  document.getElementById('s-reminder-mode').value = s.reminderMode;
  document.getElementById('s-interval-minutes').value = s.intervalMinutes;
  document.getElementById('s-default-break').value = s.defaultBreakLength;

  settingsFixedTimes = [...(s.fixedTimes || [])];
  renderFixedTimes(document.getElementById('s-fixed-times-list'), settingsFixedTimes, () =>
    renderFixedTimes(document.getElementById('s-fixed-times-list'), settingsFixedTimes));

  const isFixed = s.reminderMode === 'fixed';
  document.getElementById('s-interval-options').classList.toggle('hidden', isFixed);
  document.getElementById('s-fixed-options').classList.toggle('hidden', !isFixed);

  settingsModal.classList.remove('hidden');
}

// --- Utilities ---
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}

// --- Boot ---
if (isFirstVisit()) {
  showView('onboarding');
} else {
  startApp();
}
```

- [ ] **Step 2: Open in browser and verify onboarding flow**

Open `index.html` in a browser. Expected:
- Onboarding screen visible with "WFH Movement" heading
- Work start/end time inputs populated with 08:00/17:00 defaults
- Reminder style select works — switching to "fixed" shows fixed time options
- Adding a fixed time creates a badge; clicking the badge removes it
- Clicking "Start moving" saves settings and transitions to the dashboard

- [ ] **Step 3: Verify dashboard**

After completing onboarding:
- Dashboard shows with header, countdown, stats (0 breaks, 0 streak)
- "Take a break now" button triggers the break prompt
- Break prompt shows exercise name, area badge, illustration placeholder, description, cues
- "Show me something else" swaps to a different exercise
- "Start Quick Break" launches timer at 90 seconds
- "Start Full Break" launches timer at 300 seconds

- [ ] **Step 4: Verify timer**

After starting a break:
- Timer view shows full-screen teal background
- Countdown counts down in M:SS format
- Progress bar fills from left to right
- "Skip" button completes the break immediately
- On completion: audio tones play, returns to dashboard, break count increments

- [ ] **Step 5: Verify settings modal**

Open settings from the header button:
- Fields are pre-populated with current settings
- Saving restarts the reminder engine
- "Reset all data" with confirmation returns to onboarding

- [ ] **Step 6: Verify educational section scrolls into view**

On the dashboard view, scroll down past the stats cards. Expected: "Why this matters" section is visible with all three panels.

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: app entry point — view management, break flow, timer, settings"
```

---

## Task 8: Service Worker

**Files:**
- Create: `service-worker.js`

**Interfaces:**
- Consumes: nothing (standalone SW scope)
- Produces: background notification delivery when tab is not in focus

- [ ] **Step 1: Create `service-worker.js`**

```javascript
// service-worker.js
const CACHE_NAME = 'wfh-movement-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/exercises.js',
  '/storage.js',
  '/rotation.js',
  '/reminder.js',
  '/timer.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Listen for notification schedule messages from the main thread
self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delayMs, title, body } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'wfh-movement-break',
        renotify: true,
        data: { url: '/' }
      });
    }, delayMs);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
```

- [ ] **Step 2: Wire SW notification scheduling into `reminder.js`**

Update the `startReminderEngine` function in `reminder.js` to also send a message to the Service Worker so notifications fire even when the tab is inactive. Add this inside `startReminderEngine`, after `timeoutId = setTimeout(...)`:

```javascript
// After scheduling the timeout, also tell the SW (for background notifications)
function scheduleSwNotification(ms, settings) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delayMs: ms,
        title: 'Time to move',
        body: 'Your next movement break is ready. Work For Health.'
      });
    }
  });
}
```

Call `scheduleSwNotification(ms, settings)` inside the `schedule()` function in `startReminderEngine`, right after `timeoutId = setTimeout(...)`.

Full updated `startReminderEngine`:

```javascript
export function startReminderEngine(onReminder) {
  let timeoutId = null;

  function scheduleSwNotification(ms) {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          delayMs: ms,
          title: 'Time to move',
          body: 'Your next movement break is ready. Work For Health.'
        });
      }
    });
  }

  function schedule() {
    const settings = getSettings();
    const ms = getNextReminderMs(settings);

    if (ms === null) {
      timeoutId = setTimeout(schedule, 60 * 1000);
      return;
    }

    scheduleSwNotification(ms);

    timeoutId = setTimeout(() => {
      onReminder();
      schedule();
    }, ms);
  }

  schedule();
  return { stop: () => clearTimeout(timeoutId) };
}
```

- [ ] **Step 3: Verify service worker in browser**

Open `index.html` served from a local server (Service Workers require a server — use `npx serve .` or VS Code Live Server). Open DevTools > Application > Service Workers. Expected: service worker registered and active, status shows "activated and running."

- [ ] **Step 4: Verify offline behavior**

In DevTools > Network, check "Offline." Reload the page. Expected: app still loads from cache.

- [ ] **Step 5: Commit**

```bash
git add service-worker.js reminder.js
git commit -m "feat: service worker — offline caching and background notification delivery"
```

---

## Task 9: Deploy

**Files:**
- Create: `.gitignore`
- Create: `netlify.toml` (optional, for clean URLs)

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Create `netlify.toml`**

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 3: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 4: Deploy to Netlify**

1. Go to app.netlify.com
2. Click "Add new site" > "Import an existing project"
3. Connect GitHub, select the repo
4. Build command: leave empty. Publish directory: `.`
5. Click "Deploy site"

- [ ] **Step 5: Verify live site**

Open the Netlify URL. Verify:
- First visit shows onboarding
- Complete onboarding, reach dashboard
- Take a break now works end-to-end
- Educational section visible on scroll
- Site is installable (Chrome shows install icon in address bar)

- [ ] **Step 6: Commit deploy config**

```bash
git add .gitignore netlify.toml
git commit -m "chore: deploy config for Netlify"
git push
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Pure static site, HTML/CSS/vanilla JS | Task 1 |
| PWA manifest | Task 1 |
| Service Worker with offline cache | Task 8 |
| Notification fallback (on-screen countdown) | Task 7 |
| Exercise library, 20+ exercises, 5 areas | Task 2 |
| Exercise schema with cues, durations, illustration | Task 2 |
| Smart rotation by targetArea | Task 4 |
| localStorage schema (settings, today, history) | Task 3 |
| Onboarding (work window, mode, break length) | Task 7 |
| Interval and fixed reminder modes | Task 6 |
| Break prompt with swap mechanic | Task 7 |
| Quick (90s) and full (300s) break tiers | Tasks 5, 7 |
| Timer with progress bar and audio tones | Tasks 5, 7 |
| Streak and today break count | Tasks 3, 7 |
| Settings modal with reset | Task 7 |
| Educational section — 3 panels | Task 1 |
| Deployment to Netlify | Task 9 |

All spec requirements covered.

**Placeholder scan:** No TBDs, TODOs, or vague steps remain.

**Type consistency:** All function names are consistent across tasks — `suggestExercise`, `logBreak`, `getTodayRecord`, `startReminderEngine`, `startTimer`, `formatTime`, `playTone`, `getNextReminderMs`, `isWithinWorkWindow`.
