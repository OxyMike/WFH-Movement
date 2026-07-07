# Avatar Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick an emoji avatar from a grid in Settings; the sidebar avatar circle shows it instantly, defaulting to the name-letter.

**Architecture:** Mirrors the just-shipped theme-switcher: a new persisted `avatar` setting (default `''` = use name-letter), a picker card in the Settings tab, instant apply on click, and the same Save-button preservation guard. No new modules or dependencies.

**Tech Stack:** Vanilla JS (ES modules), plain CSS, localStorage via `storage.js`.

## Global Constraints

- Default is the name-letter (existing behavior); `avatar: ''` is the sentinel for "no emoji chosen". Existing users see no change until they opt in.
- The picker's first pill has `data-avatar=""` and reverts to the name-letter; the other 14 carry `data-avatar="<emoji>"`.
- Emoji set (exactly these 14, in this order): 👩‍💻 👨‍💻 🧘‍♀️ 🏃 💪 🚶 🤸 ☕ 🐶 🐱 🚀 🔋 🌱 ⭐
- Avatar applies instantly on click — no Save-button gating.
- The `btn-save-settings` handler rebuilds its payload field-by-field; `saveSettings()` merges against `DEFAULT_SETTINGS`, so any omitted field silently resets. `avatar: getSettings().avatar` MUST be added to that payload (same bug already fixed for `volume` and `theme`).
- Pills must use the app's CSS tokens (`--primary`, `--primary-light`, `--border-color`), not hardcoded colors, so they theme correctly under the 4 color themes.
- Spec: `docs/superpowers/specs/2026-07-06-avatar-picker-design.md`

---

### Task 1: Persist the avatar setting

**Files:**
- Modify: `storage.js` (`DEFAULT_SETTINGS`, currently ends with `theme: 'sage'`)
- Test: `tests/storage.test.js`

**Interfaces:**
- Produces: `getSettings().avatar` — string, an emoji or `''`, defaults to `''`. Later tasks read/write via existing `getSettings()`/`saveSettings()`.

- [ ] **Step 1: Write the failing test**

In `tests/storage.test.js`, inside the existing `'getSettings returns defaults when nothing saved'` test (it already asserts `s.volume`, `s.soundInstrument`, `s.theme`), add alongside them:

```javascript
  assertEqual(s.avatar, '', 'Default avatar');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/storage.test.js`
Expected: FAIL on `'Default avatar'` — `s.avatar` is `undefined`, not `''`.

- [ ] **Step 3: Add the default**

In `storage.js`, change the end of `DEFAULT_SETTINGS`:

```javascript
  volume: 0.5,
  soundInstrument: 'standard',
  theme: 'sage'
};
```

to:

```javascript
  volume: 0.5,
  soundInstrument: 'standard',
  theme: 'sage',
  avatar: ''
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/storage.test.js`
Expected: `20 passed, 0 failed` (an added assertion inside an existing test, not a new test block — count unchanged).

- [ ] **Step 5: Commit**

```bash
git add storage.js tests/storage.test.js
git commit -m "feat: add avatar setting defaulting to empty (name-letter)"
```

---

### Task 2: Avatar picker card markup and styles

**Files:**
- Modify: `index.html` (Settings tab — insert after the Aesthetics/theme `.fd-card` closes at line ~490, before `</section>` at line ~491)
- Modify: `style.css` (append new rules)

**Interfaces:**
- Produces: a `.avatar-grid` containing 15 `.avatar-pill-btn` elements — the first with `data-avatar=""` (id `avatar-letter-pill` so the render loop can set its text), the rest with `data-avatar="<emoji>"`. Task 3 queries these by class and attribute.

No automated test — static markup + CSS, verified live in Task 4.

- [ ] **Step 1: Insert the picker card**

In `index.html`, find the end of the Aesthetics theme card and the section close:

```html
                          </div>
                        </div>
                    </section>
```

Change it to (the theme card's closing `</div></div>` stays; insert the new card between it and `</section>`):

```html
                          </div>
                        </div>
                        <div class="fd-card" style="margin-top: 20px;">
                          <div class="card-title">Your avatar</div>
                          <p style="color:var(--text-muted); font-size:12.5px; margin-bottom:16px;">Pick a symbol for your sidebar. The first option keeps your name's first letter.</p>
                          <div class="avatar-grid">
                            <button class="avatar-pill-btn" id="avatar-letter-pill" data-avatar="">M</button>
                            <button class="avatar-pill-btn" data-avatar="👩‍💻">👩‍💻</button>
                            <button class="avatar-pill-btn" data-avatar="👨‍💻">👨‍💻</button>
                            <button class="avatar-pill-btn" data-avatar="🧘‍♀️">🧘‍♀️</button>
                            <button class="avatar-pill-btn" data-avatar="🏃">🏃</button>
                            <button class="avatar-pill-btn" data-avatar="💪">💪</button>
                            <button class="avatar-pill-btn" data-avatar="🚶">🚶</button>
                            <button class="avatar-pill-btn" data-avatar="🤸">🤸</button>
                            <button class="avatar-pill-btn" data-avatar="☕">☕</button>
                            <button class="avatar-pill-btn" data-avatar="🐶">🐶</button>
                            <button class="avatar-pill-btn" data-avatar="🐱">🐱</button>
                            <button class="avatar-pill-btn" data-avatar="🚀">🚀</button>
                            <button class="avatar-pill-btn" data-avatar="🔋">🔋</button>
                            <button class="avatar-pill-btn" data-avatar="🌱">🌱</button>
                            <button class="avatar-pill-btn" data-avatar="⭐">⭐</button>
                          </div>
                        </div>
                    </section>
```

The `M` placeholder text on the letter pill is overwritten live by Task 3's render loop with the real name initial; it just needs non-empty text so the button isn't zero-width before the first render.

- [ ] **Step 2: Append the CSS**

Add to the end of `style.css`:

```css
.avatar-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.avatar-pill-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1.5px solid var(--border-color);
    background-color: transparent;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;
}

.avatar-pill-btn:hover {
    border-color: var(--primary);
    background-color: var(--primary-light);
}

.avatar-pill-btn.active {
    border: 2.5px solid var(--primary);
    background-color: var(--primary-light);
}
```

- [ ] **Step 3: Confirm the full test suite is unaffected**

Run (from repo root):
```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```
Expected: every file prints `N passed, 0 failed` — this task touches no JS.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add avatar picker card and pill styles to Settings"
```

---

### Task 3: Wire the avatar picker

**Files:**
- Modify: `app.js` — `updateTopBar()` (sidebar render, lines ~248-251), `renderSettings()` (active-pill loop, after the theme-swatch loop ~line 171), the listener-registration block (after the theme-swatch listeners ~line 200), and the `btn-save-settings` handler payload (~line 208)

**Interfaces:**
- Consumes: `getSettings()`/`saveSettings()` (imported at app.js:3); `updateTopBar()` and `renderSettings()` (module-local); `sound(freq, ms)` (module-local, hoisted).
- Produces: sidebar emoji rendering, active-pill state, click-to-apply behavior. No new exports.

No isolated unit test (DOM-driven) — verified live in Task 4.

- [ ] **Step 1: Render the avatar (or letter) in the sidebar**

In `app.js` `updateTopBar()`, change:

```javascript
  const name = s.userName || 'You';
  document.getElementById('sidebar-username').textContent = name;
  document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('sidebar-level-title').textContent = getProgress().title;
```

to:

```javascript
  const name = s.userName || 'You';
  document.getElementById('sidebar-username').textContent = name;
  const avatarEl = document.getElementById('sidebar-avatar');
  avatarEl.textContent = s.avatar || name.charAt(0).toUpperCase();
  avatarEl.style.fontSize = s.avatar ? '16px' : '';
  document.getElementById('sidebar-level-title').textContent = getProgress().title;
```

- [ ] **Step 2: Mark the active pill in `renderSettings()`**

In `app.js` `renderSettings()`, immediately after the existing theme-swatch loop (the block ending `check.style.display = isActive ? 'block' : 'none'; });`), add:

```javascript
  const currentInitial = (s.userName || 'You').charAt(0).toUpperCase();
  document.getElementById('avatar-letter-pill').textContent = currentInitial;
  document.querySelectorAll('.avatar-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-avatar') === s.avatar);
  });
```

- [ ] **Step 3: Add the click listeners**

In `app.js`, immediately after the theme-swatch listener block (the `document.querySelectorAll('.theme-swatch-card').forEach(...)` that ends `sound(659.25, 300); }); });`), add:

```javascript
document.querySelectorAll('.avatar-pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const avatar = btn.getAttribute('data-avatar');
    saveSettings({ ...getSettings(), avatar });
    updateTopBar();
    renderSettings();
    sound(659.25, 300);
  });
});
```

- [ ] **Step 4: Preserve avatar through the Save-settings button**

In the `btn-save-settings` click handler, change:

```javascript
  saveSettings({
    volume: getSettings().volume,
    theme: getSettings().theme,
    userName: document.getElementById('settings-name-input').value.trim(),
```

to:

```javascript
  saveSettings({
    volume: getSettings().volume,
    theme: getSettings().theme,
    avatar: getSettings().avatar,
    userName: document.getElementById('settings-name-input').value.trim(),
```

- [ ] **Step 5: Confirm the full test suite is unaffected**

Run: `for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done`
Expected: every file prints `N passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: wire avatar picker to sidebar, instant apply, and persist"
```

---

### Task 4: Full live verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
for f in tests/*.test.js; do node "$f" || echo "FAILED: $f"; done
```
Expected: every file prints `N passed, 0 failed`, including the avatar default assertion from Task 1.

- [ ] **Step 2: Live-verify in the browser preview**

Using the running static server for `D:/ClaudeProjects/wfh-movement` (hard-reload or unregister any active service worker first — this repo has a known stale-SW gotcha):

1. Set a name in Settings (or via seeded state) and confirm the sidebar avatar shows that name's first letter by default, and the letter pill in the picker shows the same initial and is marked active.
2. Click an emoji pill (e.g. 💪) — confirm the sidebar avatar updates to that emoji instantly (no reload), the active ring moves to that pill, and a chime plays.
3. Reload the page (hard reload) — confirm the emoji avatar persists in the sidebar.
4. Click the first pill (the name-letter) — confirm the sidebar reverts to the letter and the letter pill goes active.
5. Pick an emoji again, then change an unrelated setting (e.g. daily goal) and click "Save settings" — confirm the avatar is NOT reset to the letter afterward (Task 3 Step 4 regression check).
6. Switch to a non-sage color theme and confirm the pill borders/hover/active states use the theme's primary color (they should, since they reference `--primary`/`--primary-light`).
7. Confirm no console errors throughout.

- [ ] **Step 3: Report results**

No commit (verification only) — confirm all checks passed, or list what failed for a follow-up fix.
