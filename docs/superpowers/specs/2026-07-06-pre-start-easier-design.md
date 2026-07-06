# Pre-Start Easier — Design

**Date:** 2026-07-06
**Feature:** Let the Easier button work before an activity starts (while resting), reducing the suggested quest's time and, unlike the live version, docking XP proportionally.

## Summary

`btn-live-easier` today only does anything while a quest is live (`liveQuest` set):
it swaps in a pre-halved version of the current quest via `easierQuest()` in
`rotation.js`, restarting from step 1. That path is deliberate and
tested (`easierQuest preserves identity and reward, only time changes` —
`tests/rotation.test.js:14`) and is staying exactly as-is.

This feature adds a second path: clicking Easier while **resting** (no quest
started yet) eases the *suggested* quest shown on the rail and Primary Quest
card, and — because nothing has been attempted yet — docks XP proportionally
to how much time was cut. Repeated clicks compound, same as the live version
already does.

## Decisions (settled with Mike)

- **Live-Easier:** untouched. No XP docking, no restart-bug fix. Confirmed
  intentional after finding the test above; changing it wasn't requested once
  that was clear.
- **Resting-Easier trigger:** swaps the preview in place (title/description/
  countdown/dots update via the existing render functions). User still presses
  Start/Pause afterward to begin it.
- **XP display:** no new UI. The Primary Quest card already shows `+NN XP`
  (`primary-quest-xp`) — it just needs to stay in sync with the eased
  `suggestedQuest`, which is a correctness fix, not new UI.
- **XP ratio:** exact time ratio. If duration drops to 50%, XP drops to 50%
  (not a flat halving — the safety floor means very short quests shrink by
  less than 50%, and XP should track that).

## Data & logic

New pure function in `rotation.js`, alongside `easierQuest`:

```js
// Like easierQuest, but also docks XP proportionally to the time cut.
// Used only for the pre-start (resting) Easier path; the live path keeps
// full XP by design (see rotation.test.js).
export function easierQuestWithXpCut(quest) {
  const easy = easierQuest(quest);
  if (!easy) return null;
  const ratio = easy.duration / quest.duration;
  return { ...easy, xp: Math.max(1, Math.round(quest.xp * ratio)) };
}
```

- Delegates feasibility (the "too short to halve" null case) entirely to
  `easierQuest`; no new floor logic.
- Floors XP at 1 so a heavily-eased quest never rewards 0.
- Pure, doesn't mutate input — same contract as `easierQuest`.

## Wiring (`app.js`)

`btn-live-easier`'s click handler branches on `liveQuest`:

```js
document.getElementById('btn-live-easier').addEventListener('click', () => {
  if (!liveQuest) {
    const easier = easierQuestWithXpCut(suggestedQuest);
    if (!easier) return;
    suggestedQuest = easier;
    renderRestingRail();
    renderPrimaryQuest();
    sound(523, 150);
    return;
  }
  const easier = easierQuest(liveQuest);
  if (easier) startQuest(easier);
});
```

`renderRestingRail()` gains a visibility toggle for the button, mirroring what
`startQuest` already does for the live case:

```js
document.getElementById('btn-live-easier').classList.toggle('hidden', !easierQuest(suggestedQuest));
```

This closes an existing gap: today the button sits visible-but-dead while
resting (nothing hides it, and the click handler no-ops on `!liveQuest`).
Necessary for this feature to behave correctly, not scope creep.

**Reset:** no explicit reset code needed. `suggestedQuest` already gets
reassigned to a fresh full-difficulty pick on reroll, post-completion, and day
boundary (all via `suggestExercise`), so an eased suggestion never lingers
past its relevance.

**Compounding:** clicking Easier repeatedly while resting eases whatever
`suggestedQuest` currently is, same compounding behavior the live button
already has.

## Testing

- `tests/rotation.test.js`: new cases for `easierQuestWithXpCut` — XP ratio
  matches duration ratio, floors at 1, returns null when `easierQuest` would,
  doesn't mutate input.
- DOM wiring (button visibility, preview refresh, Start carrying the eased
  quest through) verified manually in the browser preview — not unit-testable
  without a DOM harness this project doesn't have.
