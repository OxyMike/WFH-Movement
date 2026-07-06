# Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick one of 4 named color themes (Sage Green / Midnight Indigo / Charcoal Emerald / Sunset Peach) from a swatch picker in Settings, applied instantly and persisted.

**Architecture:** CSS custom-property retrofit. Six new surface tokens (`--bg-card`, `--bg-header`, `--bg-sidebar`, `--bg-right-panel`, `--bg-onboarding-card`, `--bg-input`) replace 12 hardcoded `#FFFFFF` backgrounds in style.css. Three `html.theme-x` override blocks redefine those tokens plus `--primary`/`--coral`/`--text-color`/`--border-color`. Sage is the class-less default. A tiny inline script in `<head>` applies the saved theme to `<html>` before first paint to avoid a flash of the wrong theme.

**Tech Stack:** Vanilla JS (ES modules), plain CSS custom properties, localStorage via `storage.js`. No new dependencies.

## Global Constraints

- Sage Green must be pixel-identical to the app's current live look (it's the absence of a theme class, not a 4th CSS block).
- Theme applies instantly on swatch click — no Save-button gating (per approved spec).
- No per-theme audit of the ~15 scattered one-off accent colors (badges, streak shield, quote card, quest-tier tags) — explicitly out of scope for this plan.
- Theme class goes on `<html>` (`document.documentElement`), never `<body>` — `<body>` doesn't exist yet during head-parsing, which is when the FOUC-prevention script must run.
- Spec: `docs/superpowers/specs/2026-07-06-theme-switcher-design.md`

---

### Task 1: Persist the theme setting

**Files:**
- Modify: `storage.js:4-13` (`DEFAULT_SETTINGS`)
- Test: `tests/storage.test.js`

**Interfaces:**
- Produces: `getSettings().theme` — string, one of `'sage' | 'midnight' | 'charcoal' | 'sunset'`, defaults to `'sage'`. Later tasks read/write this via the existing `getSettings()`/`saveSettings()` exports — no new storage functions needed.

- [ ] **Step 1: Write the failing test**

Add to `tests/storage.test.js`, inside the existing `'getSettings returns defaults when nothing saved'` test (it already asserts `s.volume`/`s.soundInstrument` from Batch 2 — add the theme assertion alongside them):

```javascript
  assertEqual(s.theme, 'sage', 'Default theme');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/storage.test.js`
Expected: FAIL on `'Default theme'` — `s.theme` is `undefined`, not `'sage'`.

- [ ] **Step 3: Add the default**

In `storage.js`, change:

```javascript
const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full',
  workDays: [1, 2, 3, 4, 5],
  dailyGoal: 4,
  volume: 0.5,
  soundInstrument: 'standard'
};
```

to:

```javascript
const DEFAULT_SETTINGS = {
  workStart: '08:00',
  workEnd: '17:00',
  reminderMode: 'interval',
  intervalMinutes: 45,
  fixedTimes: [],
  defaultBreakLength: 'full',
  workDays: [1, 2, 3, 4, 5],
  dailyGoal: 4,
  volume: 0.5,
  soundInstrument: 'standard',
  theme: 'sage'
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/storage.test.js`
Expected: `20 passed, 0 failed` (was 20 before this task added one more assertion to an existing test, so the count stays the same — this adds an assertion, not a new `test(...)` block).

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/storage.test.js
git commit -m "feat: add theme setting with sage default"
```

---

### Task 2: Tokenize surface backgrounds in style.css

**Files:**
- Modify: `style.css:3-26` (`:root` block)
- Modify: `style.css` — 12 selectors listed below

**Interfaces:**
- Produces: 6 new CSS custom properties (`--bg-card`, `--bg-header`, `--bg-sidebar`, `--bg-right-panel`, `--bg-onboarding-card`, `--bg-input`), each defaulting to `#FFFFFF`. Task 3's theme blocks override these.

This task has no automated test — it's a pure visual no-op (every token defaults to the exact color it replaces, so the rendered page must look byte-for-byte identical before and after). Verification is a live-preview screenshot comparison plus the full existing test suite (none of which touch CSS, so they must be unaffected).

- [ ] **Step 1: Add the new tokens to `:root`**

In `style.css`, change:

```css
:root {
    --bg-color: #F7F8F2;
    --text-color: #202225;
    --text-muted: #5C6066;
    --primary: #2E7D67;
    --primary-light: rgba(46, 125, 103, 0.1);
    --coral: #F36B54;
    --coral-light: rgba(243, 107, 84, 0.15);
    --sky: #69B7D6;
    --sky-light: rgba(105, 183, 214, 0.15);
    --amber: #F3C45C;
    --amber-light: rgba(243, 196, 92, 0.15);
    --navy: #172133;
    --lime: #A7D96C;
    --lime-light: rgba(167, 217, 108, 0.15);

    --border-color: rgba(32, 34, 37, 0.08);
```

to:

```css
:root {
    --bg-color: #F7F8F2;
    --text-color: #202225;
    --text-muted: #5C6066;
    --primary: #2E7D67;
    --primary-light: rgba(46, 125, 103, 0.1);
    --coral: #F36B54;
    --coral-light: rgba(243, 107, 84, 0.15);
    --sky: #69B7D6;
    --sky-light: rgba(105, 183, 214, 0.15);
    --amber: #F3C45C;
    --amber-light: rgba(243, 196, 92, 0.15);
    --navy: #172133;
    --lime: #A7D96C;
    --lime-light: rgba(167, 217, 108, 0.15);

    --bg-card: #FFFFFF;
    --bg-header: #FFFFFF;
    --bg-sidebar: #FFFFFF;
    --bg-right-panel: #FFFFFF;
    --bg-onboarding-card: #FFFFFF;
    --bg-input: #FFFFFF;

    --border-color: rgba(32, 34, 37, 0.08);
```

- [ ] **Step 2: Replace the 12 hardcoded backgrounds**

Each replacement is `background-color: #FFFFFF;` → `background-color: var(--bg-*);` for the token in the table below. Use exact selector context (a few surrounding lines) to disambiguate, since the literal string `background-color: #FFFFFF;` appears at all 12 sites.

| Selector | Token |
|---|---|
| `.sidebar` (~line 69) | `--bg-sidebar` |
| `.top-bar` (~line 195) | `--bg-header` |
| `.search-input:focus` (~line 240) | `--bg-input` |
| `.right-panel` (~line 342) | `--bg-right-panel` |
| `.fd-card` (~line 382) | `--bg-card` |
| `.timeline-preset-btn` (~line 730) | `--bg-card` |
| `.timeline-hours` (~line 749) | `--bg-card` |
| `.onboarding-card` (~line 1105) | `--bg-onboarding-card` |
| `.filter-pill` (~line 1277) | `--bg-card` |
| `.cheer-btn` (~line 1410) | `--bg-card` |
| `.settings-select` (~line 1644) | `--bg-input` |
| `.btn-danger` (~line 1656) | `--bg-input` |

Example for the first one — change:

```css
.sidebar {
    width: var(--sidebar-width);
    background-color: #FFFFFF;
```

to:

```css
.sidebar {
    width: var(--sidebar-width);
    background-color: var(--bg-sidebar);
```

Repeat the same `#FFFFFF` → `var(--token)` substitution for the other 11 rows in the table, using their surrounding selector context to find the right one.

- [ ] **Step 3: Run the full test suite to confirm nothing broke**

Run (from repo root):
```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```
Expected: every file still prints `N passed, 0 failed` — this task touches no JS, so no test file should be affected.

- [ ] **Step 4: Visual no-op check in the browser preview**

Start (or reuse) the static server for `D:/ClaudeProjects/wfh-movement`, hard-reload (bypassing any service worker / HTTP cache — see the caching gotcha in the spec's parent memory if the page looks stale), and take a screenshot of the Today view and Settings view. Compare against the pre-change appearance: sidebar, top bar, cards, and inputs must look exactly as before — this task is invisible by design. Fix any visual diff before proceeding (it means a selector was mapped to the wrong token or the replacement missed).

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "refactor: tokenize hardcoded surface backgrounds for theming"
```

---

### Task 3: Add the three theme override blocks

**Files:**
- Modify: `style.css` (append after the `:root` block, before the next existing rule)

**Interfaces:**
- Produces: `html.theme-midnight`, `html.theme-charcoal`, `html.theme-sunset` CSS classes. Task 6's click handler toggles these on `document.documentElement`; Task 4's inline script also adds one of these on page load if a non-sage theme was saved.

No test — pure CSS addition, verified visually in Task 7.

- [ ] **Step 1: Append the three blocks**

Add immediately after the `:root { ... }` block's closing `}` in `style.css`:

```css
html.theme-midnight {
    --bg-color: #0B0F19;
    --text-color: #F8FAFC;
    --text-muted: #94A3B8;
    --primary: #6366F1;
    --primary-light: rgba(99, 102, 241, 0.15);
    --coral: #EC4899;
    --coral-light: rgba(236, 72, 153, 0.15);
    --border-color: rgba(255, 255, 255, 0.08);
    --bg-card: #111827;
    --bg-header: #111827;
    --bg-sidebar: #0B0F19;
    --bg-right-panel: #111827;
    --bg-onboarding-card: #111827;
    --bg-input: #1F2937;
}

html.theme-charcoal {
    --bg-color: #0F172A;
    --text-color: #F1F5F9;
    --text-muted: #94A3B8;
    --primary: #10B981;
    --primary-light: rgba(16, 185, 129, 0.15);
    --coral: #F59E0B;
    --coral-light: rgba(245, 158, 11, 0.15);
    --border-color: rgba(255, 255, 255, 0.08);
    --bg-card: #1E293B;
    --bg-header: #1E293B;
    --bg-sidebar: #0F172A;
    --bg-right-panel: #1E293B;
    --bg-onboarding-card: #1E293B;
    --bg-input: #273549;
}

html.theme-sunset {
    --bg-color: #FFF7ED;
    --text-color: #431407;
    --text-muted: #7C2D12;
    --primary: #D97706;
    --primary-light: rgba(217, 119, 6, 0.1);
    --coral: #E11D48;
    --coral-light: rgba(225, 29, 72, 0.15);
    --border-color: rgba(67, 20, 7, 0.08);
    --bg-card: #FFFAF0;
    --bg-header: #FFFAF0;
    --bg-sidebar: #FFFDF9;
    --bg-right-panel: #FFFAF0;
    --bg-onboarding-card: #FFFAF0;
    --bg-input: #FFFDF9;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: add midnight, charcoal, and sunset theme overrides"
```

---

### Task 4: FOUC-prevention script

**Files:**
- Modify: `index.html:1-11` (`<head>`)

**Interfaces:**
- Consumes: `localStorage.getItem('wfh-movement')` — same key `storage.js` uses (`const KEY = 'wfh-movement';`), same shape (`{ settings: { theme, ... } }`).
- Produces: `theme-<name>` class added to `document.documentElement` before first paint, if a non-sage theme was saved.

No automated test — this is a load-order/timing behavior, verified live in Task 7 (reload with a non-sage theme saved, confirm no flash).

- [ ] **Step 1: Add the inline script before the stylesheet link**

In `index.html`, change:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="WFH Movement: timed movement breaks for people who work at a desk. Work For Health.">
    <title>WFH Movement: Work For Health</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#2E7D67">
</head>
```

to:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="WFH Movement: timed movement breaks for people who work at a desk. Work For Health.">
    <title>WFH Movement: Work For Health</title>
    <script>
    (function () {
      try {
        var raw = localStorage.getItem('wfh-movement');
        var theme = raw && JSON.parse(raw).settings && JSON.parse(raw).settings.theme;
        if (theme && theme !== 'sage') document.documentElement.classList.add('theme-' + theme);
      } catch (e) {}
    })();
    </script>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#2E7D67">
</head>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: apply saved theme before first paint to avoid flash"
```

---

### Task 5: Theme swatch picker markup

**Files:**
- Modify: `index.html:445-451` (Settings tab, after the existing settings `.fd-card` closes, before `</section>`)

**Interfaces:**
- Produces: 4 `.theme-swatch-card` elements, each with `data-theme="sage|midnight|charcoal|sunset"`, a `.theme-circle` child and a `.checkmark-overlay` child. Task 6 queries these by class/attribute.

No test — static markup, verified visually in Task 7.

- [ ] **Step 1: Insert the swatch card**

In `index.html`, change:

```html
                            <div class="settings-item">
                              <div class="settings-label">Start over</div>
                              <div class="settings-description">Deletes your history, streaks, and settings on this device. There is no undo.</div>
                              <div class="settings-input-row"><button class="btn-danger" id="btn-reset-database">Reset all data</button></div>
                            </div>
                          </div>
                        </div>
                    </section>
```

to:

```html
                            <div class="settings-item">
                              <div class="settings-label">Start over</div>
                              <div class="settings-description">Deletes your history, streaks, and settings on this device. There is no undo.</div>
                              <div class="settings-input-row"><button class="btn-danger" id="btn-reset-database">Reset all data</button></div>
                            </div>
                          </div>
                        </div>
                        <div class="fd-card" style="margin-top: 20px;">
                          <div class="card-title">Aesthetics & Visual Themes</div>
                          <p style="color:var(--text-muted); font-size:12.5px; margin-bottom:16px;">Personalize your companion's interface color palette. Swap styles instantly.</p>
                          <div class="theme-swatch-row" style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div class="theme-swatch-card" data-theme="sage" style="display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;">
                              <div class="theme-circle" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--border-color); background: linear-gradient(135deg, #F7F8F2 50%, #2E7D67 50%); position:relative; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                                <div class="checkmark-overlay" style="color:white; font-size:12px; font-weight:700; display:none;">&#10003;</div>
                              </div>
                              <span style="font-size:11.5px; font-weight:600; color:var(--text-color);">Sage Green</span>
                            </div>
                            <div class="theme-swatch-card" data-theme="midnight" style="display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;">
                              <div class="theme-circle" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--border-color); background: linear-gradient(135deg, #0B0F19 50%, #6366F1 50%); position:relative; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                                <div class="checkmark-overlay" style="color:white; font-size:12px; font-weight:700; display:none;">&#10003;</div>
                              </div>
                              <span style="font-size:11.5px; font-weight:600; color:var(--text-color);">Midnight Indigo</span>
                            </div>
                            <div class="theme-swatch-card" data-theme="charcoal" style="display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;">
                              <div class="theme-circle" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--border-color); background: linear-gradient(135deg, #0F172A 50%, #10B981 50%); position:relative; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                                <div class="checkmark-overlay" style="color:white; font-size:12px; font-weight:700; display:none;">&#10003;</div>
                              </div>
                              <span style="font-size:11.5px; font-weight:600; color:var(--text-color);">Charcoal Emerald</span>
                            </div>
                            <div class="theme-swatch-card" data-theme="sunset" style="display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;">
                              <div class="theme-circle" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--border-color); background: linear-gradient(135deg, #FFF7ED 50%, #D97706 50%); position:relative; transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                                <div class="checkmark-overlay" style="color:#7C2D12; font-size:12px; font-weight:700; display:none;">&#10003;</div>
                              </div>
                              <span style="font-size:11.5px; font-weight:600; color:var(--text-color);">Sunset Peach</span>
                            </div>
                          </div>
                        </div>
                    </section>
```

Note: unlike the package's version, every swatch (including Sage) starts with the same `border: 1.5px solid var(--border-color)` and `display:none` checkmark — Task 6 sets the active one's border/checkmark on render, so the markup doesn't need to hardcode which theme is "active" (it depends on saved state, not always Sage).

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add theme swatch picker markup to Settings tab"
```

---

### Task 6: Wire the swatch picker

**Files:**
- Modify: `app.js:153-170` (`renderSettings()`)
- Modify: `app.js:176-185` (listener registration block)
- Modify: `app.js:187-200` (`btn-save-settings` click handler)

**Interfaces:**
- Consumes: `getSettings()`/`saveSettings()` from `storage.js` (already imported at `app.js:3`); `sound(freq, ms)` — the module-local wrapper defined later in `app.js` at the `sound(freq, ms, gainLevel)` function (hoisted, safe to call from listeners registered earlier in the file, same pattern already used by the existing sound-instrument preview listener at `app.js:177-180`).
- Produces: swatch active-state rendering and click-to-apply behavior. No new exports.

No isolated unit test (DOM-driven, browser-only) — verified live in Task 7. The one persistence-correctness risk (Save button wiping the setting) is covered by Step 3 below plus the live round-trip check in Task 7.

- [ ] **Step 1: Mark the active swatch in `renderSettings()`**

In `app.js`, change:

```javascript
  document.getElementById('settings-sound-toggle').checked = !s.muted;
  document.getElementById('settings-sound-instrument').value = s.soundInstrument;
  settingsFixedTimes = [];
```

to:

```javascript
  document.getElementById('settings-sound-toggle').checked = !s.muted;
  document.getElementById('settings-sound-instrument').value = s.soundInstrument;
  document.querySelectorAll('.theme-swatch-card').forEach(card => {
    const isActive = card.getAttribute('data-theme') === s.theme;
    const circle = card.querySelector('.theme-circle');
    const check = card.querySelector('.checkmark-overlay');
    circle.style.border = isActive ? '3px solid var(--primary)' : '1.5px solid var(--border-color)';
    check.style.display = isActive ? 'block' : 'none';
  });
  settingsFixedTimes = [];
```

- [ ] **Step 2: Add the click listeners**

In `app.js`, change:

```javascript
document.getElementById('settings-sound-instrument').addEventListener('change', (e) => {
  const s = getSettings();
  if (!s.muted) playTone(659.25, 300, 0.3 * s.volume, e.target.value);
});
```

to:

```javascript
document.getElementById('settings-sound-instrument').addEventListener('change', (e) => {
  const s = getSettings();
  if (!s.muted) playTone(659.25, 300, 0.3 * s.volume, e.target.value);
});
document.querySelectorAll('.theme-swatch-card').forEach(card => {
  card.addEventListener('click', () => {
    const theme = card.getAttribute('data-theme');
    saveSettings({ ...getSettings(), theme });
    document.documentElement.className = document.documentElement.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    if (theme !== 'sage') document.documentElement.classList.add('theme-' + theme);
    renderSettings();
    sound(659.25, 300);
  });
});
```

- [ ] **Step 3: Preserve theme through the Save-settings button**

The `btn-save-settings` handler rebuilds the settings object field-by-field and doesn't include fields it doesn't explicitly list — this is the exact bug already caught and fixed for `volume` in Batch 2 (see `app.js`'s existing `volume: getSettings().volume` line). `theme` needs the same treatment or clicking Save would silently reset it to `'sage'`.

Change:

```javascript
document.getElementById('btn-save-settings').addEventListener('click', () => {
  saveSettings({
    volume: getSettings().volume,
    userName: document.getElementById('settings-name-input').value.trim(),
```

to:

```javascript
document.getElementById('btn-save-settings').addEventListener('click', () => {
  saveSettings({
    volume: getSettings().volume,
    theme: getSettings().theme,
    userName: document.getElementById('settings-name-input').value.trim(),
```

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: wire theme swatch picker to apply instantly and persist"
```

---

### Task 7: Full live verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```
Expected: every file prints `N passed, 0 failed`, including the theme default assertion added in Task 1.

- [ ] **Step 2: Live-verify in the browser preview**

Using the running static server for `D:/ClaudeProjects/wfh-movement` (hard-reload or unregister any active service worker first — this repo has a known gotcha where a stale SW serves cached JS/CSS to the tab, documented in the theme-switcher spec's parent project memory):

1. Open Settings, confirm the 4 swatches render with Sage Green showing the active ring/checkmark by default.
2. Click Midnight Indigo — confirm the whole UI (sidebar, top bar, cards, text) recolors instantly, no page reload, no console errors, and a short chime plays.
3. Reload the page (hard reload) — confirm Midnight Indigo is still active and there's no visible flash of Sage Green before it applies.
4. Repeat for Charcoal Emerald and Sunset Peach.
5. Click Sage Green to return to default — confirm it reverts fully (no leftover `theme-*` class on `<html>`; check via `document.documentElement.className` in the console).
6. With a non-sage theme active, go to Settings, change an unrelated field (e.g. daily goal), click "Save settings" — confirm the theme is *not* reset to Sage Green afterward (this is the Task 6 Step 3 regression check).
7. Spot-check that Batch 1/2 features (health fact card, new exercises, volume slider, instrument dropdown) still render and function correctly under at least one non-sage theme — confirms no visual breakage from the token retrofit.

- [ ] **Step 3: Report results**

No commit for this task (verification only) — confirm to the user that all checks passed, or list what failed and needs a follow-up fix.
