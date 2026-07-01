# Warm Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the WFH Movement HTML/CSS around a warm, human design system with a real landing page, while leaving all JS logic modules untouched.

**Architecture:** Pure static site, no build step. `style.css` is rewritten around new CSS custom properties; `index.html` gains a landing view and restyled dashboard/timer/setup; `app.js` changes only for view flow, greeting, rotating timer cues, and completion flash. All logic modules (`storage.js`, `timer.js`, `reminder.js`, `rotation.js`, `exercises.js`) are frozen.

**Tech Stack:** HTML5, CSS3 custom properties, vanilla ES modules, Google Fonts (Nunito), existing zero-dependency test runner.

## Global Constraints

- Logic modules frozen: `storage.js`, `timer.js`, `reminder.js`, `rotation.js`, `exercises.js` must not change.
- `service-worker.js` changes ONLY the cache name, to `wfh-movement-v4`.
- localStorage key stays `wfh-movement`; schema unchanged.
- No em dashes in any copy. Voice: conversational, encouraging, never guilt, never clinical.
- All colors via CSS custom properties in `:root`; no bare hex in component styles or inline styles.
- Fonts referenced only through `--font-heading` and `--font-body` variables.
- Existing unit tests must pass unchanged: `node --experimental-vm-modules tests/run.js` from repo root.
- Working directory: `D:\ClaudeProjects\wfh-movement`.
- Button copy exact values: "Take a break now", "Quick reset · 90 sec", "Full break · 5 min", "Show me a different one".
- Hero one-liner exact: "Your body wasn't built to sit all day. Two minutes an hour fixes more than you think."

---

### Task 1: Design system rewrite (style.css)

**Files:**
- Modify: `style.css` (full rewrite of `:root` and component classes; keep `.view`/`.view.active`/`#view-timer.active` display rules)

**Interfaces:**
- Produces: CSS variables and classes every later task uses: `--color-bg #faf6f0`, `--color-card #ffffff`, `--color-primary #0e8574`, `--color-primary-deep #0a5f53`, `--color-accent #f97362`, `--color-accent-deep #e05a49`, `--color-text-heading #2b2925`, `--color-text-body #4a463f`, `--color-text-muted #8a847a`, `--color-panel-sage #e8f0e4`, `--color-panel-peach #fdeadd`, `--color-panel-cream #f7efdf`, `--color-border #ece5da`, `--font-heading 'Nunito', system-ui, sans-serif`, `--font-body 'Nunito', system-ui, sans-serif`, `--radius-card 20px`, `--radius-btn 999px`, `--shadow-card 0 6px 24px rgba(60, 50, 30, 0.08)`. Classes: `.card`, `.btn`, `.btn-primary` (teal), `.btn-accent` (coral), `.btn-ghost`, `.btn-sm`, `.btn-full`, `.badge`, `.chip`, `.container`, `.hidden`, `.text-muted`, `.text-center`, `.flex`, `.items-center`, `.justify-between`, `.gap-4`, `.mt-4`, `.mt-6`, `.input` (new shared input/select style).

- [ ] **Step 1: Rewrite `:root` and base styles**

Replace the `:root` block and base element styles at the top of `style.css` with:

```css
:root {
  --color-bg: #faf6f0;
  --color-card: #ffffff;
  --color-primary: #0e8574;
  --color-primary-deep: #0a5f53;
  --color-accent: #f97362;
  --color-accent-deep: #e05a49;
  --color-text-heading: #2b2925;
  --color-text-body: #4a463f;
  --color-text-muted: #8a847a;
  --color-panel-sage: #e8f0e4;
  --color-panel-peach: #fdeadd;
  --color-panel-cream: #f7efdf;
  --color-border: #ece5da;
  --font-heading: 'Nunito', system-ui, sans-serif;
  --font-body: 'Nunito', system-ui, sans-serif;
  --radius-card: 20px;
  --radius-btn: 999px;
  --shadow-card: 0 6px 24px rgba(60, 50, 30, 0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text-body);
  line-height: 1.6;
}

h1, h2, h3, h4 { font-family: var(--font-heading); color: var(--color-text-heading); }
```

- [ ] **Step 2: Rewrite component classes**

Replace the existing `.card`, `.btn*`, `.badge`, `.chip` blocks with:

```css
.container { max-width: 720px; margin: 0 auto; padding: 0 1.25rem; }

.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 1.75rem;
}

.btn {
  display: inline-block;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-btn);
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(60, 50, 30, 0.12); }

.btn-primary { background: var(--color-primary); color: var(--color-card); }
.btn-primary:hover { background: var(--color-primary-deep); }
.btn-accent { background: var(--color-accent); color: var(--color-card); }
.btn-accent:hover { background: var(--color-accent-deep); }
.btn-ghost { background: transparent; color: var(--color-text-muted); border: 1.5px solid var(--color-border); }
.btn-sm { font-size: 0.85rem; padding: 0.4rem 1rem; }
.btn-full { display: block; width: 100%; }

.badge {
  background: var(--color-panel-sage);
  color: var(--color-primary-deep);
  border-radius: var(--radius-btn);
  padding: 0.25rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  background: var(--color-primary);
  color: var(--color-card);
  border-radius: var(--radius-btn);
  font-size: 0.85rem;
  cursor: pointer;
}

.input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  font-family: var(--font-body);
  background: var(--color-card);
  color: var(--color-text-body);
}

.hidden { display: none !important; }
.text-muted { color: var(--color-text-muted); }
.text-center { text-align: center; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
```

Keep these existing rules unchanged at the bottom of the file:

```css
.view { display: none; }
.view.active { display: block; }
#view-timer.active { display: flex; }
```

- [ ] **Step 3: Run unit tests (must still pass, CSS cannot break them)**

Run: `node --experimental-vm-modules tests/run.js`
Expected: all tests PASS (same counts as before).

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "feat: warm design system tokens and components"
```

---

### Task 2: Landing page and setup restyle (index.html + app.js view flow)

**Files:**
- Modify: `index.html` (add `#view-landing` before `#view-onboarding`; add Google Fonts link; restyle onboarding as friendly setup; move why-content into landing)
- Modify: `app.js` (showView gains 'landing'; first visit shows landing; CTA buttons route to onboarding)

**Interfaces:**
- Consumes: CSS classes/variables from Task 1.
- Produces: `#view-landing`, `#btn-start-setup-hero`, `#btn-start-setup-bottom` element IDs; `showView('landing')` support. `#section-why` is DELETED as a standalone sibling; its content lives inside the landing view. Dashboard footer link is added in Task 3.

- [ ] **Step 1: Add Google Fonts to `<head>` of index.html**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Insert landing view as the first view in `<body>`**

```html
<!-- VIEW: Landing (first visit) -->
<div id="view-landing" class="view">
  <div class="container text-center" style="padding-top: 4rem; padding-bottom: 2rem;">
    <h1 style="font-size: 2.75rem; font-weight: 800; color: var(--color-primary); margin-bottom: 0.75rem;">WFH Movement</h1>
    <p style="font-size: 1.25rem; max-width: 480px; margin: 0 auto 2rem;">Your body wasn't built to sit all day. Two minutes an hour fixes more than you think.</p>
    <button id="btn-start-setup-hero" class="btn btn-accent" style="font-size: 1.1rem; padding: 0.85rem 2.25rem;">Start moving</button>
  </div>

  <div class="container" style="padding-bottom: 2rem;">
    <div class="card">
      <h2 style="font-size: 1.2rem; margin-bottom: 1rem;">What one hour of sitting does</h2>
      <ul style="list-style: none; line-height: 2.1;">
        <li>🩸 Circulation drops by half, blood pools in your lower legs</li>
        <li>🔥 Your metabolism slides into energy-saving mode</li>
        <li>🧈 The enzyme that burns fat in your bloodstream switches off</li>
        <li>🍬 Your muscles stop clearing sugar from your blood</li>
        <li>🦴 Pressure on your spinal discs climbs higher than standing</li>
      </ul>
      <details style="margin-top: 1rem;">
        <summary style="cursor: pointer; font-weight: 700; color: var(--color-primary);">See what long-term sitting does</summary>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="background: var(--color-panel-sage); border-radius: 12px; padding: 1rem;">
            <h4 style="margin-bottom: 0.5rem;">Heart</h4>
            <ul style="padding-left: 1.1rem; font-size: 0.9rem;"><li>54% higher heart attack risk</li><li>Stiffened arteries</li><li>Plaque buildup</li></ul>
          </div>
          <div style="background: var(--color-panel-peach); border-radius: 12px; padding: 1rem;">
            <h4 style="margin-bottom: 0.5rem;">Metabolism</h4>
            <ul style="padding-left: 1.1rem; font-size: 0.9rem;"><li>Chronic high blood pressure</li><li>Midsection weight gain</li><li>Type 2 diabetes</li></ul>
          </div>
          <div style="background: var(--color-panel-cream); border-radius: 12px; padding: 1rem;">
            <h4 style="margin-bottom: 0.5rem;">Muscles and bones</h4>
            <ul style="padding-left: 1.1rem; font-size: 0.9rem;"><li>Gluteal muscle wasting</li><li>Bone mineral loss</li><li>Early disc degeneration</li></ul>
          </div>
          <div style="background: var(--color-panel-sage); border-radius: 12px; padding: 1rem;">
            <h4 style="margin-bottom: 0.5rem;">Veins</h4>
            <ul style="padding-left: 1.1rem; font-size: 0.9rem;"><li>Varicose veins</li><li>Deep vein blood clots</li></ul>
          </div>
        </div>
        <p style="margin-top: 1rem; font-size: 0.95rem;">Your evening workout can't undo it either. The damage happens hour by hour, so the fix has to happen hour by hour too.</p>
      </details>
    </div>

    <div class="card mt-6 text-center">
      <h2 style="font-size: 1.2rem; margin-bottom: 1.25rem;">How it works</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
        <div><div style="font-size: 2rem;">🕘</div><p style="font-weight: 700;">Set your hours</p><p class="text-muted" style="font-size: 0.9rem;">Tell us when your workday runs</p></div>
        <div><div style="font-size: 2rem;">👋</div><p style="font-weight: 700;">Get gentle nudges</p><p class="text-muted" style="font-size: 0.9rem;">A friendly reminder, never a nag</p></div>
        <div><div style="font-size: 2rem;">🤸</div><p style="font-weight: 700;">Move for 2 minutes</p><p class="text-muted" style="font-size: 0.9rem;">PT-picked moves that undo the chair</p></div>
      </div>
      <button id="btn-start-setup-bottom" class="btn btn-accent mt-6" style="font-size: 1.1rem; padding: 0.85rem 2.25rem;">Start moving</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Delete the standalone `#section-why` block entirely** (its content now lives in the landing view).

- [ ] **Step 4: Restyle the onboarding view as a friendly setup**

Replace `#view-onboarding`'s inner heading area and swap every inline-styled input/select/label for the shared classes. The form keeps the exact same field IDs (`work-start`, `work-end`, `reminder-mode`, `interval-minutes`, `fixed-options`, `fixed-times-list`, `fixed-time-input`, `add-fixed-time`, `default-break`, `btn-complete-onboarding`). New wrapper:

```html
<div id="view-onboarding" class="view">
  <div class="container text-center" style="padding-top: 3rem; padding-bottom: 3rem;">
    <h1 style="font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 0.5rem;">Let's set you up</h1>
    <p class="text-muted" style="margin-bottom: 2rem;">Three quick questions and you're moving</p>
    <div class="card" style="max-width: 480px; margin: 0 auto; text-align: left;">
      <!-- keep existing form fields, but every input/select gets class="input"
           and every label gets style="display: block; font-weight: 700; margin-bottom: 0.4rem;" -->
    </div>
  </div>
</div>
```

Field group order and labels: "When does your workday start?" (`work-start`), "And when does it wrap up?" (`work-end`), "How should we nudge you?" (`reminder-mode`), interval/fixed sub-options unchanged, "How long is a good break for you?" (`default-break`). Final button text: "Start moving".

- [ ] **Step 5: Update app.js view flow**

In `showView`, change the id list to include landing:

```js
['view-landing', 'view-onboarding', 'view-dashboard', 'view-timer'].forEach(id => {
  document.getElementById(id).classList.remove('active');
});
```

Remove the two `whySection` lines from `showView` (the element no longer exists).

At the boot block, change first-visit routing and wire the CTAs:

```js
document.getElementById('btn-start-setup-hero').addEventListener('click', () => showView('onboarding'));
document.getElementById('btn-start-setup-bottom').addEventListener('click', () => showView('onboarding'));

if (isFirstVisit()) {
  showView('landing');
} else {
  startApp();
}
```

- [ ] **Step 6: Manual verification**

Open `index.html` in a browser with localStorage cleared (`localStorage.removeItem('wfh-movement')` in console, reload). Expected: landing page renders with hero, why-card, how-it-works; both "Start moving" buttons open setup; completing setup lands on the first exercise.

- [ ] **Step 7: Run unit tests**

Run: `node --experimental-vm-modules tests/run.js`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add index.html app.js
git commit -m "feat: landing page and friendly setup flow"
```

---

### Task 3: Dashboard redesign (index.html + app.js)

**Files:**
- Modify: `index.html` (`#view-dashboard` inner markup)
- Modify: `app.js` (greeting function, placeholder art zone rendering, why-link toggle)

**Interfaces:**
- Consumes: Task 1 classes; existing IDs `next-break-countdown`, `next-break-label`, `stat-today`, `stat-streak`, `btn-take-break-now`, `btn-open-settings`, `dashboard-idle`, `dashboard-active`, `active-exercise-*`, `btn-start-quick`, `btn-start-full`, `btn-swap-exercise` (all preserved).
- Produces: new IDs `dashboard-greeting`, `link-why`, `dashboard-why` used only within this task.

- [ ] **Step 1: Rewrite `#view-dashboard` markup**

```html
<div id="view-dashboard" class="view">
  <header style="padding: 1.25rem 0;">
    <div class="container flex items-center justify-between">
      <span style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--color-primary);">WFH Movement</span>
      <button id="btn-open-settings" class="btn btn-ghost btn-sm">Settings</button>
    </div>
  </header>

  <div class="container" style="padding-bottom: 2rem;">
    <h1 id="dashboard-greeting" style="font-size: 1.5rem; margin-bottom: 1rem;">Good morning, let's keep you moving</h1>

    <div id="dashboard-idle">
      <div class="card text-center">
        <p class="text-muted" style="font-size: 0.9rem;">Next nudge in</p>
        <div id="next-break-countdown" style="font-size: 3rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-primary); line-height: 1.1;">--:--</div>
        <p id="next-break-label" class="text-muted" style="margin-top: 0.5rem;">Setting up your schedule...</p>

        <div class="flex gap-4 mt-6" style="justify-content: center;">
          <div class="text-center">
            <div id="stat-today" style="font-size: 2rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-primary);">0</div>
            <p class="text-muted" style="font-size: 0.8rem;">breaks today</p>
          </div>
          <div style="width: 1px; background: var(--color-border);"></div>
          <div class="text-center">
            <div style="display: flex; align-items: baseline; gap: 0.25rem; justify-content: center;">
              <span style="font-size: 1.2rem;">🔥</span>
              <span id="stat-streak" style="font-size: 2rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-accent);">0</span>
            </div>
            <p class="text-muted" style="font-size: 0.8rem;">day streak</p>
          </div>
        </div>

        <button id="btn-take-break-now" class="btn btn-accent btn-full mt-6">Take a break now</button>
      </div>

      <p class="text-center mt-6">
        <a id="link-why" href="#" style="color: var(--color-text-muted); font-size: 0.9rem;">Why breaks matter</a>
      </p>
      <div id="dashboard-why" class="hidden card mt-4">
        <h3 style="margin-bottom: 0.75rem;">Why breaks matter</h3>
        <p>Within one hour of sitting, your circulation drops by half, your metabolism slows, and your muscles stop clearing sugar from your blood. Your evening workout can't undo it. The fix is simple: two minutes of movement for every hour in the chair, and that's exactly what your nudges are for.</p>
      </div>
    </div>

    <div id="dashboard-active" class="hidden">
      <div class="card">
        <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
          <h2 id="active-exercise-name" style="font-size: 1.25rem;"></h2>
          <span id="active-exercise-area" class="badge"></span>
        </div>

        <div id="active-exercise-illustration" style="background: var(--color-panel-sage); border-radius: 16px; height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 1rem; gap: 0.4rem;">
        </div>

        <p id="active-exercise-description" style="margin-bottom: 0.75rem;"></p>
        <ul id="active-exercise-cues" style="list-style: none; margin-bottom: 1.25rem; line-height: 1.9;"></ul>

        <div class="flex gap-4">
          <button id="btn-start-quick" class="btn btn-primary" style="flex: 1;">Quick reset · 90 sec</button>
          <button id="btn-start-full" class="btn btn-accent" style="flex: 1;">Full break · 5 min</button>
        </div>
        <button id="btn-swap-exercise" class="btn btn-ghost btn-full mt-4">Show me a different one</button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add greeting + why-toggle + placeholder art in app.js**

Add near the helpers:

```js
const AREA_ICONS = { hips: '🦵', spine: '🧘', shoulders: '💪', neck: '🙆', wrists: '🖐️' };

function updateGreeting() {
  const h = new Date().getHours();
  const text = h < 12 ? "Good morning, let's keep you moving"
    : h < 17 ? "Good afternoon, time to shake off the chair"
    : "Good evening, one more stretch before you wind down";
  document.getElementById('dashboard-greeting').textContent = text;
}
```

Call `updateGreeting()` inside `startApp()`.

Replace the illustration block in `renderActiveExercise` with the placeholder art zone (image slot preserved for later):

```js
const illustrationEl = document.getElementById('active-exercise-illustration');
illustrationEl.innerHTML = `
  <span style="font-size: 2.5rem;">${AREA_ICONS[exercise.targetArea] || '🤸'}</span>
  <span class="badge">${capitalize(exercise.targetArea)}</span>`;
```

Replace the cue `<li>` creation in `renderActiveExercise` so each cue reads as a friendly checkmark:

```js
(exercise.cues || []).forEach(cue => {
  const li = document.createElement('li');
  li.textContent = `✓ ${cue}`;
  cuesEl.appendChild(li);
});
```

Wire the why link with the other listeners:

```js
document.getElementById('link-why').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('dashboard-why').classList.toggle('hidden');
});
```

- [ ] **Step 3: Manual verification**

Reload as a returning user. Expected: greeting matches time of day, warm stats with flame streak, coral "Take a break now", why-link toggles the explainer, triggering a break shows icon placeholder + checkmark cues + renamed buttons.

- [ ] **Step 4: Run unit tests**

Run: `node --experimental-vm-modules tests/run.js`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: warm dashboard with greeting, streak flame, placeholder art"
```

---

### Task 4: Timer screen warmth (index.html + app.js)

**Files:**
- Modify: `index.html` (`#view-timer` background gradient, ring glow, single-cue element, completion flash element)
- Modify: `app.js` (`launchTimer` rotating cue logic, completion flash before `completeBreak`)

**Interfaces:**
- Consumes: `startTimer`, `playTone`, `formatTime` from `timer.js` (unchanged); `#timer-ring` dashoffset behavior from current app.js.
- Produces: `#timer-cue` (replaces `#timer-cues` list), `#timer-complete-flash`.

- [ ] **Step 1: Update `#view-timer` markup**

Replace the view's opening tag, cue list, and add the flash element:

```html
<div id="view-timer" class="view" style="min-height: 100vh; background: linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary-deep) 100%); color: var(--color-card); flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
  <h2 id="timer-exercise-name" style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem; text-align: center; color: var(--color-card);"></h2>

  <div style="position: relative; margin-bottom: 1.75rem;">
    <svg viewBox="0 0 280 280" width="220" height="220" style="display: block; filter: drop-shadow(0 0 12px rgba(255,255,255,0.35));">
      <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="14"/>
      <circle id="timer-ring" cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="753.98" stroke-dashoffset="0"
        transform="rotate(-90 140 140)" style="transition: stroke-dashoffset 1s linear;"/>
    </svg>
    <div id="timer-countdown" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 3.25rem; font-weight: 800; font-family: var(--font-heading); line-height: 1; font-variant-numeric: tabular-nums;">5:00</div>
  </div>

  <p id="timer-cue" style="text-align: center; max-width: 340px; min-height: 3.2em; margin-bottom: 2rem; font-size: 1.05rem; color: rgba(255,255,255,0.9); transition: opacity 0.4s ease;"></p>

  <div id="timer-complete-flash" class="hidden" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--color-primary-deep); font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; color: var(--color-card); z-index: 50;">Nice work 🎉</div>

  <button id="btn-skip-timer" class="btn btn-ghost" style="color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3);">Skip</button>
</div>
```

- [ ] **Step 2: Rotating cues + flash in app.js**

Add module-level `let cueInterval = null;`. In `launchTimer`, replace the cue-list block with:

```js
const cues = exercise.cues || [];
let cueIndex = 0;
const cueEl = document.getElementById('timer-cue');
cueEl.textContent = cues[0] || '';
if (cueInterval) clearInterval(cueInterval);
cueInterval = setInterval(() => {
  cueIndex = (cueIndex + 1) % Math.max(cues.length, 1);
  cueEl.style.opacity = '0';
  setTimeout(() => {
    cueEl.textContent = cues[cueIndex] || '';
    cueEl.style.opacity = '1';
  }, 400);
}, 8000);
document.getElementById('timer-complete-flash').classList.add('hidden');
```

In the `onComplete` callback, replace the existing body with:

```js
playTone(659, 300);
setTimeout(() => playTone(784, 400), 350);
document.getElementById('timer-complete-flash').classList.remove('hidden');
setTimeout(() => {
  document.getElementById('timer-complete-flash').classList.add('hidden');
  completeBreak(currentExercise);
}, 1500);
```

In both `completeBreak` and the skip handler, clear the cue rotation:

```js
if (cueInterval) { clearInterval(cueInterval); cueInterval = null; }
```

(Put this line at the top of `completeBreak`; the skip handler already routes through `completeBreak`.)

- [ ] **Step 3: Manual verification**

Start a quick break. Expected: gradient background, glowing ring, one cue at a time fading every 8 seconds, "Nice work 🎉" flash for 1.5s on completion, then dashboard with incremented stats. Skip returns immediately with no flash.

- [ ] **Step 4: Run unit tests**

Run: `node --experimental-vm-modules tests/run.js`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: warm timer with rotating cues and completion flash"
```

---

### Task 5: Cache bump, full pass, deploy

**Files:**
- Modify: `service-worker.js:1` (cache name only)
- Modify: `manifest.json` (theme_color to `#0e8574`, background_color to `#faf6f0`)
- Modify: `index.html` `<head>` (`<meta name="theme-color" content="#0e8574">`)

**Interfaces:**
- Consumes: everything above.
- Produces: deployed site.

- [ ] **Step 1: Bump cache and theme colors**

```js
const CACHE_NAME = 'wfh-movement-v4';
```

In `manifest.json`: `"theme_color": "#0e8574"`, `"background_color": "#faf6f0"`. In `index.html`: `<meta name="theme-color" content="#0e8574">`.

- [ ] **Step 2: Full manual pass**

Clear localStorage, reload: landing → setup → first exercise → quick timer → completion flash → dashboard stats. Reload again: straight to dashboard. Open settings, change interval, save, confirm countdown updates.

- [ ] **Step 3: Run unit tests**

Run: `node --experimental-vm-modules tests/run.js`
Expected: all PASS.

- [ ] **Step 4: Commit and push (Netlify auto-deploys)**

```bash
git add service-worker.js manifest.json index.html
git commit -m "feat: v4 cache and warm theme colors, ship redesign"
git push
```

- [ ] **Step 5: Verify live site**

After ~30s, fetch https://symphonious-rabanadas-9731f3.netlify.app/ and confirm the landing hero copy ("Your body wasn't built to sit all day") is present. Remind the user to hard-refresh once (`Ctrl+Shift+R`).
