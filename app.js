// app.js -- entry point for WFH Movement
import { EXERCISES } from './exercises.js';
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit } from './storage.js';
import { suggestExercise } from './rotation.js';
import { startReminderEngine, isWithinWorkWindow, getNextReminderMs } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';
import { TIER_DURATION, awardBreak, getProgress } from './game.js';

// Module-level state
let currentExercise = null;
let currentTier = null;
let snoozeTimeout = null;
let activeTimer = null;
let reminderEngine = null;
let countdownInterval = null;
let halfwayPlayed = false;
let cueInterval = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateGreeting() {
  const h = new Date().getHours();
  const text = h < 12 ? "Good morning, let's keep you moving"
    : h < 17 ? "Good afternoon, time to shake off the chair"
    : "Good evening, one more stretch before you wind down";
  document.getElementById('dashboard-greeting').textContent = text;
}

// ---------------------------------------------------------------------------
// View management
// ---------------------------------------------------------------------------

function showView(name) {
  ['view-landing', 'view-onboarding', 'view-dashboard', 'view-timer'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById('view-' + name).classList.add('active');
}

// ---------------------------------------------------------------------------
// Dashboard stats and countdown
// ---------------------------------------------------------------------------

function updateDashboardStats() {
  document.getElementById('stat-today').textContent = getTodayRecord().completedBreaks.length;
  document.getElementById('stat-streak').textContent = getStreak().streak;
}

function updateLevelDisplay() {
  const p = getProgress();
  document.getElementById('dash-level-title').textContent = `Level ${p.level} · ${p.title}`;
  const label = document.getElementById('dash-xp-label');
  const fill = document.getElementById('dash-xp-bar-fill');
  if (p.xpForNext === null) {
    label.textContent = `${p.xp} XP · max level`;
    fill.style.width = '100%';
  } else {
    label.textContent = `${p.xpIntoLevel} / ${p.xpForNext} XP`;
    fill.style.width = `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;
  }
}

function startCountdownDisplay() {
  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const settings = getSettings();
    const now = new Date();
    const countdownEl = document.getElementById('next-break-countdown');
    const labelEl = document.getElementById('next-break-label');

    if (!isWithinWorkWindow(settings, now)) {
      countdownEl.textContent = '--:--';
      labelEl.textContent = 'Outside work hours';
      return;
    }

    const ms = getNextReminderMs(settings, now);
    if (ms === null) {
      countdownEl.textContent = '--:--';
      labelEl.textContent = 'No reminders scheduled';
      return;
    }

    countdownEl.textContent = formatTime(Math.ceil(ms / 1000));
    labelEl.textContent = 'until next movement break';
  }

  tick();
  countdownInterval = setInterval(tick, 10000);
}

// ---------------------------------------------------------------------------
// App startup
// ---------------------------------------------------------------------------

function startApp() {
  showView('dashboard');
  updateGreeting();
  updateDashboardStats();
  updateLevelDisplay();
  startCountdownDisplay();

  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
}

// ---------------------------------------------------------------------------
// Break flow
// ---------------------------------------------------------------------------

function triggerBreak() {
  const streak = getStreak().streak;
  const note = document.getElementById('choice-streak-note');
  if (streak >= 1) {
    note.textContent = `keeps your ${streak}-day streak alive`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
  document.getElementById('dashboard-idle').classList.add('hidden');
  document.getElementById('dashboard-active').classList.remove('hidden');
  showView('dashboard');
}

function startTierBreak(tier) {
  currentTier = tier;
  const record = getTodayRecord();
  currentExercise = suggestExercise(record.lastTargetArea, null, tier);
  launchTimer(currentExercise, TIER_DURATION[tier]);
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

function launchTimer(exercise, durationSeconds) {
  showView('timer');
  document.getElementById('timer-exercise-name').textContent = exercise.name;
  document.getElementById('timer-exercise-area').textContent = capitalize(exercise.targetArea);

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

  if (activeTimer) activeTimer.stop();
  halfwayPlayed = false;
  document.getElementById('timer-ring').style.strokeDashoffset = '0';

  activeTimer = startTimer(
    durationSeconds,
    function onTick(remaining, progress) {
      const CIRCUMFERENCE = 753.98;
      document.getElementById('timer-countdown').textContent = formatTime(remaining);
      document.getElementById('timer-ring').style.strokeDashoffset = String(CIRCUMFERENCE * progress);

      if (!halfwayPlayed && progress >= 0.5) {
        halfwayPlayed = true;
        playTone(523, 150);
      }
    },
    function onComplete() {
      playTone(659, 300);
      setTimeout(() => playTone(784, 400), 350);

      const result = awardBreak(currentTier);
      document.getElementById('reward-xp').textContent = `+${result.xpGained} XP`;
      const p = getProgress();
      const barFill = document.getElementById('reward-bar-fill');
      barFill.style.width = '0%';
      const levelupEl = document.getElementById('reward-levelup');
      if (result.leveledUp) {
        levelupEl.textContent = `Level ${result.level} unlocked: ${result.title}`;
        levelupEl.classList.remove('hidden');
        setTimeout(() => playTone(880, 400), 750);
      } else {
        levelupEl.classList.add('hidden');
      }
      document.getElementById('timer-complete-flash').classList.remove('hidden');
      requestAnimationFrame(() => {
        barFill.style.width = p.xpForNext === null ? '100%' : `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;
      });
      const holdMs = result.leveledUp ? 2500 : 1500;
      setTimeout(() => {
        document.getElementById('timer-complete-flash').classList.add('hidden');
        completeBreak(currentExercise);
      }, holdMs);
    }
  );
}

function completeBreak(exercise) {
  if (cueInterval) { clearInterval(cueInterval); cueInterval = null; }
  logBreak(exercise.id, exercise.targetArea);
  showView('dashboard');
  document.getElementById('dashboard-active').classList.add('hidden');
  document.getElementById('dashboard-idle').classList.remove('hidden');
  updateDashboardStats();
  updateLevelDisplay();
  currentTier = null;
}

// ---------------------------------------------------------------------------
// Settings modal
// ---------------------------------------------------------------------------

// Fixed times tracking for both onboarding and settings modal
let onboardingFixedTimes = [];
let settingsFixedTimes = [];

function addTimeChip(time, listEl, timesArray) {
  if (!time || timesArray.includes(time)) return;
  timesArray.push(time);

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.style.cssText = 'display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.6rem; background: var(--color-primary); color: var(--color-bg); border-radius: 999px; font-size: 0.85rem; cursor: pointer;';
  chip.textContent = time;
  chip.title = 'Click to remove';
  chip.addEventListener('click', () => {
    const idx = timesArray.indexOf(time);
    if (idx !== -1) timesArray.splice(idx, 1);
    chip.remove();
  });
  listEl.appendChild(chip);
}

function openSettingsModal() {
  const settings = getSettings();
  document.getElementById('s-work-start').value = settings.workStart;
  document.getElementById('s-work-end').value = settings.workEnd;
  document.getElementById('s-reminder-mode').value = settings.reminderMode;
  document.getElementById('s-interval-minutes').value = String(settings.intervalMinutes);
  document.getElementById('s-default-break').value = settings.defaultBreakLength;

  // Reset fixed times list using addTimeChip for each saved time
  settingsFixedTimes = [];
  const listEl = document.getElementById('s-fixed-times-list');
  listEl.innerHTML = '';
  (settings.fixedTimes || []).forEach(t => addTimeChip(t, listEl, settingsFixedTimes));

  // Toggle visible options
  const mode = settings.reminderMode;
  document.getElementById('s-interval-options').classList.toggle('hidden', mode === 'fixed');
  document.getElementById('s-fixed-options').classList.toggle('hidden', mode === 'interval');

  document.getElementById('modal-settings').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

function saveSettingsFromModal() {
  const settings = {
    workStart: document.getElementById('s-work-start').value,
    workEnd: document.getElementById('s-work-end').value,
    reminderMode: document.getElementById('s-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('s-interval-minutes').value, 10),
    fixedTimes: [...settingsFixedTimes],
    defaultBreakLength: document.getElementById('s-default-break').value
  };
  saveSettings(settings);
  closeSettingsModal();

  // Restart reminder engine with new settings
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
  startCountdownDisplay();
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

function completeOnboarding() {
  const settings = {
    workStart: document.getElementById('work-start').value,
    workEnd: document.getElementById('work-end').value,
    reminderMode: document.getElementById('reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('interval-minutes').value, 10),
    fixedTimes: [...onboardingFixedTimes],
    defaultBreakLength: document.getElementById('default-break').value
  };
  saveSettings(settings);

  if ('Notification' in window) {
    Notification.requestPermission().catch(() => {});
  }

  startApp();
  triggerBreak();
}

// ---------------------------------------------------------------------------
// Wire up event listeners
// ---------------------------------------------------------------------------

// Onboarding
document.getElementById('reminder-mode').addEventListener('change', function () {
  const isFixed = this.value === 'fixed';
  document.getElementById('interval-options').classList.toggle('hidden', isFixed);
  document.getElementById('fixed-options').classList.toggle('hidden', !isFixed);
});

document.getElementById('add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('fixed-time-input');
  addTimeChip(input.value, document.getElementById('fixed-times-list'), onboardingFixedTimes);
  input.value = '';
});

document.getElementById('btn-complete-onboarding').addEventListener('click', completeOnboarding);

// Dashboard
document.getElementById('btn-take-break-now').addEventListener('click', triggerBreak);

document.getElementById('btn-tier-easy').addEventListener('click', () => startTierBreak('easy'));
document.getElementById('btn-tier-medium').addEventListener('click', () => startTierBreak('medium'));
document.getElementById('btn-tier-hard').addEventListener('click', () => startTierBreak('hard'));

document.getElementById('link-snooze').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('dashboard-active').classList.add('hidden');
  document.getElementById('dashboard-idle').classList.remove('hidden');
  if (snoozeTimeout) clearTimeout(snoozeTimeout);
  snoozeTimeout = setTimeout(triggerBreak, 15 * 60 * 1000);
});

document.getElementById('link-why').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('dashboard-why').classList.toggle('hidden');
});

// Timer
document.getElementById('btn-swap-on-timer').addEventListener('click', () => {
  if (!currentTier || !currentExercise) return;
  const record = getTodayRecord();
  currentExercise = suggestExercise(record.lastTargetArea, currentExercise.id, currentTier);
  launchTimer(currentExercise, TIER_DURATION[currentTier]);
});

document.getElementById('btn-skip-timer').addEventListener('click', () => {
  if (activeTimer) {
    activeTimer.stop();
    activeTimer = null;
  }
  if (currentExercise) completeBreak(currentExercise);
});

// Settings modal
document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);
document.getElementById('btn-close-settings').addEventListener('click', closeSettingsModal);
document.getElementById('btn-save-settings').addEventListener('click', saveSettingsFromModal);

document.getElementById('btn-reset-data').addEventListener('click', () => {
  if (window.confirm('Reset all data? This cannot be undone.')) {
    resetAll();
    window.location.reload();
  }
});

document.getElementById('s-reminder-mode').addEventListener('change', function () {
  const isFixed = this.value === 'fixed';
  document.getElementById('s-interval-options').classList.toggle('hidden', isFixed);
  document.getElementById('s-fixed-options').classList.toggle('hidden', !isFixed);
});

document.getElementById('s-add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('s-fixed-time-input');
  addTimeChip(input.value, document.getElementById('s-fixed-times-list'), settingsFixedTimes);
  input.value = '';
});

// ---------------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------------

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.getElementById('btn-start-setup-hero').addEventListener('click', () => showView('onboarding'));
document.getElementById('btn-start-setup-bottom').addEventListener('click', () => showView('onboarding'));

if (isFirstVisit()) {
  showView('landing');
} else {
  startApp();
}
