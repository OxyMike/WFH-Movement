# Aesthetics & Visual Themes (Theme Switcher) — Design

## Source

Package §12 "Aesthetics & Visual Themes" from `integration_package.md` (Antigravity brain export, appended 2026-07-06 after Batches 1-2 were already scoped). Four themes: Sage Green (current default), Midnight Indigo, Charcoal Emerald, Sunset Peach.

## Goals

- User can pick one of 4 named color themes from a swatch picker in Settings.
- Theme applies instantly on click (no Save button), persists across reloads, no flash of the wrong theme on load.
- Sage Green is the default and is visually identical to the app's current live look — existing users see no change until they opt into a different theme.

## Non-goals

- No per-theme audit of the ~15 scattered one-off accent hex colors (badge tints, streak-shield color, quote-card tint, quest-tier colors). These are left exactly as they are today. If a specific accent reads badly on a dark theme once this ships, that's a follow-up fix, not part of this build.
- No custom/user-defined colors — 4 fixed named themes only.
- No per-theme accessibility contrast audit beyond what the package's supplied color values already provide.

## Approach

CSS custom-property retrofit + a single class toggle on `<html>`. Rejected alternatives: swapping `<link>` stylesheets per theme (causes visible flash on toggle, 4 near-duplicate files to maintain) and computing colors at runtime in JS (no requirement for arbitrary/custom colors, pure overengineering for 4 fixed palettes).

## Architecture

### New CSS tokens (style.css `:root`)

Add, defaulting to today's actual values (Sage Green requires no override block — it *is* these defaults):

```css
--bg-card: #FFFFFF;
--bg-header: #FFFFFF;
--bg-sidebar: #FFFFFF;
--bg-right-panel: #FFFFFF;
--bg-onboarding-card: #FFFFFF;
--bg-input: #FFFFFF;
```

Every hardcoded `background-color: #FFFFFF` in style.css (12 occurrences — confirmed by direct grep; an earlier draft of this spec miscounted this as 27 by including `color: #FFFFFF` text/icon declarations, which are intentionally left alone since they're white-on-colored-accent text, not themed surfaces) is replaced with the matching `var(--bg-*)` token:

| Selector | Line | Token |
|---|---|---|
| `.sidebar` | 69 | `--bg-sidebar` |
| `.top-bar` | 195 | `--bg-header` |
| `.search-input:focus` | 240 | `--bg-input` |
| `.right-panel` | 342 | `--bg-right-panel` |
| `.fd-card` | 382 | `--bg-card` |
| `.timeline-preset-btn` | 730 | `--bg-card` |
| `.timeline-hours` | 749 | `--bg-card` |
| `.onboarding-card` | 1105 | `--bg-onboarding-card` |
| `.filter-pill` | 1277 | `--bg-card` |
| `.cheer-btn` | 1410 | `--bg-card` |
| `.settings-select` | 1644 | `--bg-input` |
| `.btn-danger` | 1656 | `--bg-input` |

Pills/chips/containers (`.timeline-preset-btn`, `.timeline-hours`, `.filter-pill`, `.cheer-btn`) map to `--bg-card` as the general "light surface" token. Bordered form-control-like elements (`.search-input:focus`, `.settings-select`, `.btn-danger`) map to `--bg-input`.

### Theme override blocks

Three new blocks, values taken directly from the package (§12B), selector renamed from the package's `body.theme-x` to `html.theme-x` (see FOUC section for why):

```css
html.theme-midnight { --bg-color: #0B0F19; --text-color: #F8FAFC; --text-muted: #94A3B8; --primary: #6366F1; --primary-light: rgba(99,102,241,0.15); --coral: #EC4899; --coral-light: rgba(236,72,153,0.15); --border-color: rgba(255,255,255,0.08); --bg-card: #111827; --bg-header: #111827; --bg-sidebar: #0B0F19; --bg-right-panel: #111827; --bg-onboarding-card: #111827; --bg-input: #1F2937; }

html.theme-charcoal { --bg-color: #0F172A; --text-color: #F1F5F9; --text-muted: #94A3B8; --primary: #10B981; --primary-light: rgba(16,185,129,0.15); --coral: #F59E0B; --coral-light: rgba(245,158,11,0.15); --border-color: rgba(255,255,255,0.08); --bg-card: #1E293B; --bg-header: #1E293B; --bg-sidebar: #0F172A; --bg-right-panel: #1E293B; --bg-onboarding-card: #1E293B; --bg-input: #273549; }

html.theme-sunset { --bg-color: #FFF7ED; --text-color: #431407; --text-muted: #7C2D12; --primary: #D97706; --primary-light: rgba(217,119,6,0.1); --coral: #E11D48; --coral-light: rgba(225,29,72,0.15); --border-color: rgba(67,20,7,0.08); --bg-card: #FFFAF0; --bg-header: #FFFAF0; --bg-sidebar: #FFFDF9; --bg-right-panel: #FFFAF0; --bg-onboarding-card: #FFFAF0; --bg-input: #FFFDF9; }
```

No `.theme-sage` block exists — sage is the absence of a theme class.

### Persistence

`storage.js` `DEFAULT_SETTINGS` gains `theme: 'sage'`, same merge pattern as every other setting (`getSettings()`/`saveSettings()` already handle this for free).

### FOUC prevention

The theme class must be on the document before first paint, or a saved dark theme flashes Sage Green on every reload. `<body>` doesn't exist yet while the parser is still in `<head>`, so the class goes on `<html>` (`document.documentElement`) instead of `<body>` — this is the one deliberate deviation from the package's `body.theme-x` selectors.

A small inline `<script>` is added to `index.html`'s `<head>`, before the `style.css` `<link>`:

```html
<script>
(function () {
  try {
    var raw = localStorage.getItem('wfh-movement');
    var theme = raw && JSON.parse(raw).settings && JSON.parse(raw).settings.theme;
    if (theme && theme !== 'sage') document.documentElement.classList.add('theme-' + theme);
  } catch (e) {}
})();
</script>
```

### UI

New standalone `.fd-card` in the Settings tab, appended below the existing settings card (matching the package's own structure — a separate card, not folded into the existing settings-item list). Contains the title, description, and a row of 4 swatch circles (markup ported from package §12A) with an active-state ring + checkmark on the current theme.

### Wiring (app.js)

- `renderSettings()` gains a loop over `.theme-swatch-card` elements: mark the one matching `getSettings().theme` as active (border + checkmark), clear the others. Runs on every settings render, same as the existing sound-instrument dropdown population.
- One `click` listener per swatch card (registered once at module load, same pattern as `settings-sound-instrument`'s `change` listener): on click, `saveSettings({ ...getSettings(), theme })`, toggle `document.documentElement.classList` (remove any existing `theme-*` class, add the new one if not `sage`), re-run `renderSettings()` to update the active ring, and play the existing preview chime (`sound(659.25, 300)`, reusing the tone already added for the instrument-preview feature).

## Testing

Theme logic here is CSS + DOM class toggling, not much pure logic. One test added to `tests/storage.test.js`, same pattern as the volume/soundInstrument defaults test: `getSettings().theme` defaults to `'sage'`.

Manual/live verification: cycle through all 4 swatches in the browser preview, confirm the whole UI recolors, confirm a saved non-sage theme survives a hard reload with no flash, confirm no console errors.

## Files touched

- `style.css` — new `:root` tokens, 27 hardcoded `#FFFFFF` replacements, 3 new theme override blocks, swatch card styling
- `storage.js` — `theme: 'sage'` added to `DEFAULT_SETTINGS`
- `index.html` — inline FOUC-prevention script in `<head>`, new theme-swatch card markup in Settings tab
- `app.js` — swatch active-state rendering in `renderSettings()`, click listeners
- `tests/storage.test.js` — default theme test

## Known gap (explicitly deferred)

The ~15 one-off accent hex colors (badges, streak shield, quote card, quest-tier tags) are not part of this build. They'll keep their current light-mode values under every theme. If one looks wrong once this is live, that's a small targeted follow-up, not a re-open of this spec.
