# Wrist Reminders — Server Push Backend (design)

Date: 2026-07-10
Status: approved, building
Precedent: web-push spike confirmed on Apple Watch 2026-07-10 (commit `54eaf6e`, SW v14).

## Goal

Break reminders reach the phone + Apple Watch **when the app is closed**. The
spike proved delivery; this makes it fire on the user's schedule without the app
running. No native app.

## Why a backend at all

`reminder.js` schedules a `setTimeout` inside the service worker. iOS kills the
worker on close, so that timer dies with it. Only a **server-sent push** wakes a
closed PWA. So a scheduler must live server-side.

## Architecture

Static site stays as-is. Add two Netlify Functions + Netlify Blobs (KV). No new
vendor — already on Netlify.

- **`save-subscription`** (HTTP POST): client sends `{subscription, schedule}`.
  Stored in Blobs under the subscription endpoint hash as the key. Idempotent.
- **`send-reminders`** (scheduled, `*/5 * * * *`): iterate stored subs, decide who
  is due *in their own timezone*, push them, update `lastSentKey`. Delete subs on
  HTTP 404/410 (uninstalled/expired).

## Data model (one Blob per subscriber)

```
{
  subscription: { endpoint, keys: { p256dh, auth } },   // from pushManager
  workStart: "08:00", workEnd: "17:00",
  workDays: [1,2,3,4,5],
  reminderMode: "interval" | "fixed",
  intervalMinutes: 45,
  fixedTimes: ["10:00","14:00"],
  timezone: "America/New_York",   // IANA, from Intl.DateTimeFormat().resolvedOptions()
  lastSentKey: "2026-07-10T645" | null   // localDate + slot-minute; dedup token
}
```

Only the schedule + push endpoint leave the device. **No XP, streak, history,
stiffness, or hydration.** The endpoint is pseudonymous (identifies a browser).

## The two hard parts (everything else is plumbing)

### 1. Timezone
`getNextReminderMs()` reads `now.getHours()` = server-local = UTC in a function.
Buzzing at 3am is the failure mode. Fix: store an IANA `timezone`, and derive the
user's wall-clock (`minute-of-day`, `weekday`, `local date`) via
`Intl.DateTimeFormat` with `timeZone`. All schedule math runs on those numbers,
never on server-local Date.

### 2. Dedup
Cron ticks every 5 min; naive send fires the same slot repeatedly. Fix: a **slot
key** = `localDate + "T" + slotMinute`. A reminder is due iff the most recent
scheduled slot at-or-before now differs from `lastSentKey`. Send at most one per
tick; then set `lastSentKey` to that slot. Timezone-safe (pure wall-clock),
restart-safe (persisted), no epoch reconstruction.

Slots match the client: interval reminders start at `workStart + interval` (not at
workStart); fixed mode uses `fixedTimes`.

Both live in a new **pure** module `push-schedule.js` (`toMinutes`, `localParts`,
`dueReminder`) with unit tests — same pattern as `lifelog.js`.

## Client changes

Replace the temporary BETA card with a real **"Wrist reminders"** toggle in
Settings:
- ON → request permission, `pushManager.subscribe`, POST `{subscription, schedule,
  timezone}` to `save-subscription`.
- Re-POST whenever reminder settings are saved (schedule can change).
- Copy privacy line in the card: *"Your reminder schedule is stored so we can send
  the buzz. Your progress, history, and body data never leave this device."*

## Secrets
VAPID **private** key → Netlify env var `VAPID_PRIVATE_KEY` (+ `VAPID_PUBLIC_KEY`,
`VAPID_SUBJECT`). Never in the repo. Public key stays embedded in client (safe).

## Out of scope / ceilings
- Interval < 5 min could skip a slot (cron granularity). Movement reminders are
  30–60 min; fine. `# ceiling: 5-min cron granularity`.
- No per-user auth; endpoint possession is the identity. Acceptable for an alarm.
- Grid "away"/presence, HealthKit movement detection — native-only, not here.

## Verification plan
- `push-schedule.js`: full unit tests (tz, dedup, work window, both modes,
  midnight/day boundary). Runnable via `node`.
- Functions: cannot be fully tested from dev machine. Verify post-deploy — set env
  vars, subscribe from phone, wait for a real 5-min tick, confirm wrist buzz.

## Manual steps for Mike (post-build)
1. Netlify UI → env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
2. Deploy (functions + Blobs auto-provision on Netlify).
3. Re-add to Home Screen, toggle Wrist Reminders on, wait for the next :00/:05 tick.
