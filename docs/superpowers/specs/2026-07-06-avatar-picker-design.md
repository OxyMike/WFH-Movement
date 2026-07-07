# Avatar Picker — Design

## Source

Package §10 "Companion Profile Avatar Picker" from `integration_package.md`. Adapted: Settings-only (no onboarding slide), larger curated emoji set, name-letter kept as the default and as a first-class revert option. The package's "Desk Crew network feed" framing is dropped — this is purely local sidebar identity, not the scrapped social feature.

## Goals

- User picks an emoji avatar from a grid in Settings; the sidebar avatar circle shows it immediately.
- Default is the current behavior — the first letter of the user's name — so existing users see no change until they opt in.
- Reverting from an emoji back to the name-letter is one click (a dedicated first pill), not a dead end.

## Non-goals

- No onboarding-wizard slide (Settings-only, per approved scope).
- No social/feed integration — the avatar never leaves this device's sidebar.
- No custom/uploaded images or arbitrary emoji entry — a fixed curated grid only.

## Approach

Mirror the just-shipped theme-switcher pattern (known-good in this codebase): a new persisted setting, a picker card in Settings, instant apply on click, and the same Save-button preservation guard. No new modules, no dependencies.

## Architecture

### Persistence

`storage.js` `DEFAULT_SETTINGS` gains `avatar: ''`. Empty string is the sentinel for "no emoji chosen — use the name-letter." Same `getSettings()`/`saveSettings()` merge pattern as every other setting; existing localStorage without an `avatar` key resolves to `''` for free.

### Emoji set

14 emojis, defined as a module-level constant in `app.js`:

```
👩‍💻 👨‍💻 🧘‍♀️ 🏃 💪 🚶 🤸 ☕ 🐶 🐱 🚀 🔋 🌱 ⭐
```

### Sidebar rendering (`updateTopBar`, app.js:248-250)

```javascript
const name = s.userName || 'You';
document.getElementById('sidebar-username').textContent = name;
const avatarEl = document.getElementById('sidebar-avatar');
avatarEl.textContent = s.avatar || name.charAt(0).toUpperCase();
avatarEl.style.fontSize = s.avatar ? '16px' : '';
```

The `.avatar` circle's base `font-size` is `12px` (good for a letter). An emoji reads better slightly larger, so set `16px` inline when an emoji is shown and clear the inline override (fall back to the 12px stylesheet value) when it's the letter.

### Picker UI

New standalone `.fd-card` in the Settings tab, appended after the Aesthetics/theme card (which is currently the last card). Structure:

- Card title "Your avatar" + one-line description.
- A `.avatar-grid` of pill-buttons. The **first** pill has `data-avatar=""` and shows the user's current name-letter (rendered live, since the name can change) — selecting it clears any emoji and returns to the letter. The remaining 14 pills each carry `data-avatar="<emoji>"` and display that emoji.
- The pill matching the current `settings.avatar` gets an active ring (same visual treatment as the theme swatches: `border` + subtle highlight).

### Wiring (`app.js`)

- `renderSettings()` gains a loop over `.avatar-pill-btn`: set the letter-pill's text to the current name initial, and mark the pill whose `data-avatar` equals `getSettings().avatar` active (others inactive). Runs on every settings render, same as the theme-swatch loop.
- One `click` listener per pill (registered once at module load, same pattern as the theme swatches): on click, `saveSettings({ ...getSettings(), avatar })`, then `updateTopBar()` to refresh the sidebar, then `renderSettings()` to move the active ring, then the existing preview chime `sound(659.25, 300)`.
- **Save-button preservation:** add `avatar: getSettings().avatar` to the `btn-save-settings` handler's payload object, right beside the existing `volume:` and `theme:` guards. This handler rebuilds settings field-by-field and `saveSettings()` merges against `DEFAULT_SETTINGS`, so any omitted field silently resets — the exact bug already fixed twice (volume, theme). Without this line, saving any unrelated setting would wipe the chosen avatar back to the name-letter.

### CSS (`style.css`)

- Reuse the existing `.avatar` rule for the sidebar circle (unchanged).
- Add `.avatar-grid` (flex-wrap row) and `.avatar-pill-btn` (circular 36px button, border, hover/active states), adapted from package §10B, using the app's existing CSS tokens (`--primary`, `--primary-light`, `--border-color`) rather than the package's hardcoded colors — so the pills theme correctly under the 4 color themes shipped in the theme-switcher.

## Testing

- One assertion added to `tests/storage.test.js`'s existing default-settings test: `getSettings().avatar` defaults to `''`.
- The rest is DOM wiring + CSS, verified live in the browser preview (established codebase convention): pick each emoji → sidebar updates instantly; pick the letter pill → reverts; reload → persists; change an unrelated setting and Save → avatar not reset; confirm the pills theme correctly under a non-sage theme; no console errors.

## Files touched

- `storage.js` — `avatar: ''` in `DEFAULT_SETTINGS`.
- `app.js` — emoji constant, `updateTopBar` sidebar render, `renderSettings` active-pill loop, click listeners, Save-button preservation line.
- `index.html` — avatar picker card in Settings tab.
- `style.css` — `.avatar-grid` and `.avatar-pill-btn` rules.
- `tests/storage.test.js` — default avatar assertion.

## Known gap (explicitly deferred)

The emoji glyphs render via the OS/browser emoji font; appearance varies by platform (Windows vs. macOS vs. Android). Acceptable — no custom emoji font is in scope.
