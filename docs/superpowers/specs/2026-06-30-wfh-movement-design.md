# WFH Movement — Design Spec
**Date:** 2026-06-30  
**Status:** Approved

---

## Overview

WFH Movement is a static website that helps people who work from home or in hybrid arrangements counter the physical damage of prolonged sitting. It delivers timed movement reminders throughout the workday, guides users through targeted exercises curated from a PT-backed library, and educates them on why frequent micro-movement matters more than end-of-day workouts alone.

The name reclaims the WFH acronym: Work For Health.

---

## Scope (v1)

**In scope:** reminder engine, exercise library, break timer, educational content, local progress tracking, PWA installability.

**Out of scope:** user accounts, leagues, teams, leaderboards, social features. These are designed for in v2 but not built now.

---

## Architecture

### Stack
- Pure static site: HTML, CSS, vanilla JavaScript
- No build tools, no framework, no dependencies
- Deployed to Netlify or GitHub Pages

### Files
| File | Purpose |
|------|---------|
| `index.html` | Single page, all views |
| `style.css` | All styles, CSS custom properties for theming |
| `app.js` | Core application logic, view management, reminder engine |
| `exercises.js` | Curated exercise library as a JS array |
| `service-worker.js` | Background notification scheduling |
| `manifest.json` | PWA manifest for installability |

### Data
All state lives in `localStorage` under the key `wfh-movement`. Structure:

```json
{
  "settings": {
    "workStart": "08:00",
    "workEnd": "17:00",
    "reminderMode": "interval | fixed",
    "intervalMinutes": 45,
    "fixedTimes": ["10:00", "13:00", "15:00"],
    "defaultBreakLength": "quick | full"
  },
  "today": {
    "date": "2026-06-30",
    "completedBreaks": [],
    "lastTargetArea": null
  },
  "history": {
    "streak": 0,
    "totalBreaks": 0,
    "lastActiveDate": null
  }
}
```

This schema is designed to extend cleanly into server-side persistence when accounts are added in v2.

---

## Reminder Engine

The Service Worker registers on first load and handles notification scheduling. Two modes:

**Interval mode:** fires every N minutes (user-configured, default 45) within the work window.

**Fixed schedule mode:** fires at user-set times within the work window.

**Notification fallback:** if the user denies notification permission, the main dashboard shows a live countdown to the next break. The app is fully functional without notifications.

---

## Break Flow

1. Reminder fires (notification or on-screen cue)
2. Break screen appears with a suggested exercise and two options: Quick Break (2 min) or Full Break (5–10 min)
3. User can swap to a different exercise before starting
4. Timer screen takes over the viewport — large countdown, exercise name, coaching cues
5. Audio tone at halfway point and completion
6. Break logged to localStorage, streak updated, return to dashboard

### Exercise Suggestion Logic
The engine reads `today.lastTargetArea` and weights the next suggestion toward a different body area. This prevents hitting the same muscle group consecutively. If the user swaps, the swapped exercise's target area is still logged for rotation purposes.

---

## Exercise Library

Stored in `exercises.js` as an array of objects. 20–25 exercises at launch across five target areas.

### Schema
```javascript
{
  id: "hip-flexor-stretch",
  name: "Hip Flexor Stretch",
  targetArea: "hips",         // hips | spine | shoulders | neck | wrists
  description: "...",
  cues: [                     // 2–3 PT coaching cues
    "Keep your back knee soft",
    "Drive your hips forward, not your chest",
    "Hold the tension, don't bounce"
  ],
  quickDuration: 90,          // seconds
  fullDuration: 300,          // seconds
  illustration: "hip-flexor-stretch.svg"
}
```

### Target Areas & Exercises (launch set)
| Area | Purpose | Exercises |
|------|---------|-----------|
| Hips & Glutes | Counteracts hip flexor shortening | Hip flexor stretch, glute bridge, standing figure-four, lateral hip circles |
| Spine & Core | Decompresses lumbar, activates posterior chain | Cat-cow, thoracic rotation, dead bug, standing backbend |
| Shoulders & Chest | Reverses forward-rounded desk posture | Doorway chest opener, shoulder blade squeeze, cross-body shoulder stretch, overhead reach |
| Neck & Upper Traps | Addresses tech neck pattern | Chin tucks, lateral neck stretch, levator scapulae stretch, neck rolls |
| Wrists & Forearms | Critical for keyboard workers | Wrist flexor/extensor stretch, prayer stretch, forearm supination |

---

## Views

### Onboarding (first visit only)
Single-screen setup collecting: work window start/end, reminder mode (interval or fixed), interval duration or fixed times, default break length, notification permission. Stored to localStorage on completion. Never shown again unless user resets settings.

### Dashboard (idle state)
- Next reminder countdown
- Today's completed break count
- Current streak
- Quick access to settings

### Dashboard (active break state)
- Takes over the screen
- Suggested exercise name, target area, illustration
- "Start Quick Break" and "Start Full Break" buttons
- "Show me something else" swap option

### Timer Screen
- Full viewport focus view
- Large countdown display
- Exercise name and coaching cues
- Audio tone at halfway and end
- Returns to idle dashboard on completion

### Settings Modal
- Adjust work window
- Switch reminder mode
- Change interval duration or fixed times
- Change default break length
- Reset all data

---

## Educational Section ("Why Move?")

Positioned below the hero on the homepage, visible on scroll. Three panels:

**Panel 1 — What happens in the next 60 minutes**  
Immediate effects of one hour of sitting: circulation drops 50%, metabolism slows, lipoprotein lipase shuts off, insulin resistance begins, spinal compression increases. Creates urgency in the present tense.

**Panel 2 — What accumulates over months and years**  
Long-term damage by system: cardiovascular (54% higher heart attack risk), metabolic (Type 2 diabetes, weight gain), musculoskeletal (gluteal amnesia, disc degeneration), vascular (DVT risk). Sobering, not fear-mongering.

**Panel 3 — Why your gym session isn't enough**  
Research shows end-of-day workouts cannot fully undo the damage of all-day sitting. The solution is frequent micro-movement: the 30-minute rule (2–5 minutes of movement per 30–60 minutes seated), exercise snacks (1 minute of bodyweight movement to restart metabolism). This panel ends with a natural CTA into the app's reminder system.

*Voice note: content is locked, tone will be refined to match Mike's PT-credible, matter-of-fact style before launch.*

---

## Visual Design

**Name:** WFH Movement  
**Tone:** Clean, professional, PT-credible. Productivity tool with a health conscience — not a gym app.

**Color:** Deep teal or slate blue primary, amber or green accent for timers and CTAs. White background, generous whitespace.

**Typography:** Single sans-serif family, two weights. Confident headers, readable body text.

**Timer UI:** Large, centered, full-viewport during active breaks. Single point of focus.

**UI copy voice:** Direct and encouraging. "Time to move" not "Let's crush it!" Matter-of-fact about the science, warm about the human.

---

## PWA

A `manifest.json` enables "Add to Home Screen" on mobile and pinning as a desktop app in Chrome. Makes the tool feel native for users who want it open during their workday without keeping a browser tab visible.

---

## v2 Scope (not built now)

- User accounts with server-side history
- Teams and leagues
- Competitive leaderboards
- Social accountability features

The localStorage schema and exercise data structure are designed to extend into this without refactoring.
