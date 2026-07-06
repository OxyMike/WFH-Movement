# Stiffness Scan v2 + Body Defense Coaching — Design

**Date:** 2026-07-06
**Status:** Approved pending user review
**Phase:** 2 (single-player gamification)
**Supersedes:** the on-demand binary stiffness scan shipped 2026-07-04 (`docs/superpowers/specs/2026-07-04-stiffness-scan-design.md`)
**Reference mockup:** user's prototype (captured to scratchpad as `mockup.html` / `mockup-app.js` / `mockup-style.css`). This spec ports the mockup's design and logic onto production's modular ES architecture.

## Purpose

Replace the tap-on/off scan with an always-visible **Active Body Stiffness Scan**: five body zones, each rated None / Mild / Tight. The rating drives an **adaptive coaching engine** that recommends the quest for the user's tightest zone, flags it "Critical Body Defense," and fills a **Body Defense Insights** panel with per-zone coaching copy. This single change also delivers the backlog's "coach insights / body-defense panel" item.

## Scope

- **In:** severity model, always-on scan card, coaching engine, recommendation card restyle, Body Defense Insights panel, per-zone copy, styling.
- **Out / preserved:** the daily-goal progress ring stays on Today (scan card stacks with it, per user). No XP economy change (see below). No new dependencies.

## Decisions (settled with user)

1. **Tight outranks Mild.** The recommendation targets the *tightest* zone; Mild only matters if nothing is Tight.
2. **Scan card stacks with the goal-ring card** — the ring is not removed.
3. **"Back" label → `core` targetArea.** The exercise library has no back-tagged quest; production's five zones stay `neck, shoulders, core, wrists, legs`. The scan shows "Back" but selects `core` quests and stores under key `core`.
4. **Badge only, no XP bonus.** The "Critical Body Defense" badge is visual; the recommended quest grants its own normal XP. No +100 bonus (avoids inflating the economy already flagged for rebalance).

## 1. Data model

- Per-day field on the today record: `bodyStiffness` = `{ neck, shoulders, core, wrists, legs }`, each `0` (None) / `1` (Mild) / `2` (Tight). Defaults all-`0` on a fresh day (resets daily, matching the "current posture" semantic).
- Replaces the shipped `stiffAreas: []` array. No migration needed — it was per-day and two days live; a fresh day yields the new shape. `getTodayRecord()` returns `bodyStiffness: {neck:0,shoulders:0,core:0,wrists:0,legs:0}` on a fresh day; drop `stiffAreas`.
- `saveBodyStiffness(zone, level)` persists one zone's level onto today's record (replaces `saveStiffAreas`).

## 2. Coaching engine — new module `coaching.js`

Pure, unit-testable. No DOM, no storage.

- `tightestZone(bodyStiffness)` → the zone key with the highest level, or `null` if all `0`. Tie-break order: `neck → shoulders → core → wrists → legs` (mockup order with back→core).
- `preferredAreasFrom(bodyStiffness)` → array of zone keys with level `> 0` (used to bias non-primary suggestions all day). Empty when nothing logged.
- `coachingFor(zone)` → `{ headline, body, bullets }` where `bullets` is `[{text, critical}]`. Copy is verbatim from the mockup (Appendix A). `zone === null` returns the generic "Posture Recovery" copy.
- The primary quest for a tight zone is chosen with the existing `suggestExercise(lastTargetArea, excludeId, tier, preferredAreas)` using `preferredAreas = [tightestZone]`. No hardcoded quest ids — the picker already biases by targetArea.

## 3. Scan card (index.html + app.js)

- Replaces the shipped scan markup. Navy `fd-card` with header ("Active Body Stiffness Scan" / "Check current posture tightness zones") and a "Live Coaching Active" badge, plus `<div id="stiffness-check-group">`.
- `renderStiffnessCheckGroup()` (app.js) injects five `.stiffness-chip-row`s. Rows and labels (emoji verbatim): `🦒 Neck`, `🤷 Shoulders`, `🧘 Back` (key `core`), `🖐️ Wrists`, `🦵 Legs`. Each row has three `.stiffness-btn` (None/Mild/Tight); the current level gets `active-none`/`active-mild`/`active-tight`.
- Clicking a level button: `saveBodyStiffness(zone, level)` → `renderStiffnessCheckGroup()` → `recalcCoaching()` → play the existing "next" tone. Tap-only, no Done button (live).

## 4. Recommendation card + Body Defense Insights (index.html + app.js)

- `recalcCoaching()` (app.js) reads `getTodayRecord().bodyStiffness`, computes `tightestZone`, sets `suggestedQuest` via the picker, and updates:
  - Primary quest card: title (append `<span class="quest-critical-badge">Critical Body Defense</span>` when a zone is tight, else plain), desc, time, XP (quest's own XP).
  - Body Defense Insights panel: `#coach-insight-headline`, `#coach-insight-body`, and `#coach-defense-bullets` (one `.coach-bullet` per bullet; dot gets `.normal` when `critical:false`).
- The panel is a new `.timeline-container` block on Today below the daily-quests grid (🧠 avatar + headline + body + bullets), per mockup.

## 5. Wiring changes

- The seven existing `suggestExercise` call sites that passed `record.stiffAreas` now pass `preferredAreasFrom(getTodayRecord().bodyStiffness)` so reroll/reminder/resume stay biased toward all logged-stiff zones.
- Remove the old scan handlers (open/toggle/Done) and `saveStiffAreas`.

## 6. Styling (style.css)

Port these classes verbatim from the mockup (Appendix B): `.stiffness-chip-row`, `.stiffness-chip-label`, `.stiffness-btn-group`, `.stiffness-btn` (+ `:hover`, `.active-none/mild/tight`), `.coach-bullet`, `.coach-bullet-dot` (+ `.normal`), `.coach-bullet-text`, `.quest-critical-badge`. All referenced CSS vars (`--navy`, `--amber`, `--coral`, `--coral-light`, `--primary`, `--primary-light`, `--border-color`) already exist in production — no new tokens.

## 7. Testing

`coaching.js` is the testable core (node asserts, existing harness):
- `tightestZone`: returns highest-level zone; tie-break favors earlier in order; `null` when all zero.
- `tightestZone`: a single Tight (2) outranks any number of Mild (1).
- `preferredAreasFrom`: returns only zones with level > 0; `[]` when all zero; maps nothing extra (keys already `core`).
- `coachingFor`: returns the correct headline for each zone and the generic copy for `null`.
- `suggestExercise` bias is already covered by the v1 tests; no change to rotation.js.

Scan/coach DOM wiring: controller browser-verification (toggle sets level + color, tight zone flips recommendation to that zone + badge, panel copy updates, all-None returns generic).

## 8. Ship

- Bump service worker cache **v10 → v11**; add `/coaching.js` to the precache `ASSETS` list.

---

## Appendix A — coaching copy (verbatim)

**Generic (no zone tight):**
- headline: `Coaching Focus: Posture Recovery`
- body: `No active stiffness logged. Proposing standard mobility flows to protect your body against silent strain build-up.`
- bullets (both `critical:false`): `Prolonged sitting triggers hidden posture stress even when you feel fine.` / `Every 45 minutes of keyboard use should be met with 3 minutes of shoulder extensions.`

**neck** — headline `Coaching Focus: Cervical Spine Reset`; body `Neck tightness logged. Performing neck stretches and retractions helps prevent nerve compression and strain.`; bullets (critical): `Make sure your computer screen is at eye level to prevent neck strain.` / `Retracting your chin gently resets cervical alignment and reduces shoulder load.`

**shoulders** — headline `Coaching Focus: Chest & Shoulder Opening`; body `Shoulder strain logged. Engaging chest and shoulder opening stretches to counter slouched posture.`; bullets: `Keep your shoulders pulled down and back while you sit to maintain scapular activation.` / `Doorway stretches open the front body and release respiratory restrictions.`

**core (labeled "Back")** — headline `Coaching Focus: Thoracic Spinal Twist`; body `Lumbar pressure logged. Activating rotational extensions hydrates spinal discs to prevent bulging.`; bullets: `Use a lumbar support cushion or a rolled-up towel behind your lower back to maintain proper posture.` / `Rotational spine movement unloads deep back stabilizers and improves ribcage expansion.`

**wrists** — headline `Coaching Focus: Extremity Tendon Stretch`; body `Wrist fatigue or finger numbness logged. Extending wrist flexors offsets sustained typing shear stress.`; bullets: `Keep frequently used items within easy reach on your desk to avoid excessive reaching and twisting.` / `Stretching your wrist back pulls on tight tendons, preventing carpal channel pressure build-up.`

**legs** — headline `Coaching Focus: Posterior Chain & Vascular Activation`; body `Leg swelling, fluid build-up, or glute weakness logged. Activating glutes and moving spikes lower extremity circulation.`; bullets: `Take a brief activity break to stand up every 30 to 45 minutes to refresh circulation.` / `Cardio bursts contract major muscle pumps, forcing pooled blood out of the legs.`

## Appendix B — component CSS (verbatim from mockup)

```css
.stiffness-chip-row { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); flex-grow: 1; }
.stiffness-chip-label { font-size: 12px; font-weight: 600; min-width: 80px; color: rgba(255,255,255,0.9); }
.stiffness-btn-group { display: flex; gap: 4px; }
.stiffness-btn { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; }
.stiffness-btn:hover { background: rgba(255,255,255,0.1); color: #FFFFFF; }
.stiffness-btn.active-none { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #FFFFFF; }
.stiffness-btn.active-mild { background: var(--amber); border-color: var(--amber); color: var(--navy); }
.stiffness-btn.active-tight { background: var(--coral); border-color: var(--coral); color: #FFFFFF; box-shadow: 0 0 8px rgba(243,107,84,0.4); }
.coach-bullet { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; }
.coach-bullet-dot { margin-top: 5px; width: 6px; height: 6px; border-radius: 50%; background-color: var(--coral); flex-shrink: 0; }
.coach-bullet-dot.normal { background-color: var(--primary); }
.coach-bullet-text { line-height: 1.4; }
.quest-critical-badge { background-color: var(--coral-light); color: var(--coral); font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(243,107,84,0.2); text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px; display: inline-block; }
```
