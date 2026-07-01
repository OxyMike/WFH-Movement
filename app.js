// app.js -- entry point for WFH Movement
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit } from './storage.js';
import { suggestExercise } from './rotation.js';
import { startReminderEngine, isWithinWorkWindow, getNextReminderMs } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';

// Module-level state
let currentExercise = null;
let activeTimer = null;
let reminderEngine = null;
let countdownInterval = null;
let halfwayPlayed = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// View management
// ---------------------------------------------------------------------------

function showView(name) {
  ['view-onboarding', 'view-dashboard', 'view-timer'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById('view-' + name).classList.add('active');
  const whySection = document.getElementById('section-why');
  whySection.style.display = name === 'dashboard' ? 'block' : 'none';
}

// ---------------------------------------------------------------------------
// Dashboard stats and countdown
// ---------------------------------------------------------------------------

function updateDashboardStats() {
  document.getElementById('stat-today').textContent = getTodayRecord().completedBreaks.length;
  document.getElementById('stat-streak').textContent = getStreak().streak;
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
  updateDashboardStats();
  startCountdownDisplay();

  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
}

// ---------------------------------------------------------------------------
// Break flow
// ---------------------------------------------------------------------------

function renderActiveExercise(exercise) {
  document.getElementById('active-exercise-name').textContent = exercise.name;
  document.getElementById('active-exercise-area').textContent = capitalize(exercise.targetArea);

  const illustrationEl = document.getElementById('active-exercise-illustration');
  illustrationEl.innerHTML = exercise.illustration
    ? `<img src="illustrations/${exercise.illustration}" alt="${exercise.name}" style="max-height: 140px; max-width: 100%;">`
    : '';

  document.getElementById('active-exercise-description').textContent = exercise.description;

  const cuesEl = document.getElementById('active-exercise-cues');
  cuesEl.innerHTML = '';
  (exercise.cues || []).forEach(cue => {
    const li = document.createElement('li');
    li.textContent = cue;
    cuesEl.appendChild(li);
  });
}

function triggerBreak() {
  const record = getTodayRecord();
  const lastTargetArea = record.lastTargetArea;
  currentExercise = suggestExercise(lastTargetArea, null);

  document.getElementById('dashboard-idle').classList.add('hidden');
  document.getElementById('dashboard-active').classList.remove('hidden');

  renderActiveExercise(currentExercise);
  showView('dashboard');
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

function launchTimer(exercise, durationSeconds) {
  showView('timer');
  document.getElementById('timer-exercise-name').textContent = exercise.name;

  const cuesEl = document.getElementById('timer-cues');
  cuesEl.innerHTML = '';
  (exercise.cues || []).forEach(cue => {
    const li = document.createElement('li');
    li.textContent = cue;
    cuesEl.appendChild(li);
  });

  if (activeTimer) activeTimer.stop();
  halfwayPlayed = false;

  activeTimer = startTimer(
    durationSeconds,
    function onTick(remaining, progress) {
      document.getElementById('timer-countdown').textContent = formatTime(remaining);
      document.getElementById('timer-progress-fill').style.width = `${progress * 100}%`;

      if (!halfwayPlayed && progress >= 0.5) {
        halfwayPlayed = true;
        playTone(523, 150);
      }
    },
    function onComplete() {
      playTone(659, 300);
      setTimeout(() => playTone(784, 400), 350);
      setTimeout(() => completeBreak(currentExercise), 750);
    }
  );
}

function completeBreak(exercise) {
  logBreak(exercise.id, exercise.targetArea);
  showView('dashboard');
  document.getElementById('dashboard-active').classList.add('hidden');
  document.getElementById('dashboard-idle').classList.remove('hidden');
  updateDashboardStats();
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

  // Reset fixed times list
  settingsFixedTimes = [...(settings.fixedTimes || [])];
  const listEl = document.getElementById('s-fixed-times-list');
  listEl.innerHTML = '';
  settingsFixedTimes.forEach(t => {
    const arr = settingsFixedTimes;
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.cssText = 'display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.6rem; background: var(--color-primary); color: var(--color-bg); border-radius: 999px; font-size: 0.85rem; cursor: pointer;';
    chip.textContent = t;
    chip.title = 'Click to remove';
    chip.addEventListener('click', () => {
      const idx = arr.indexOf(t);
      if (idx !== -1) arr.splice(idx, 1);
      chip.remove();
    });
    listEl.appendChild(chip);
  });

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

document.getElementById('btn-start-quick').addEventListener('click', () => {
  if (currentExercise) launchTimer(currentExercise, 90);
});

document.getElementById('btn-start-full').addEventListener('click', () => {
  if (currentExercise) launchTimer(currentExercise, 300);
});

document.getElementById('btn-swap-exercise').addEventListener('click', () => {
  const record = getTodayRecord();
  currentExercise = suggestExercise(record.lastTargetArea, currentExercise ? currentExercise.id : null);
  renderActiveExercise(currentExercise);
});

// Timer
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

if (isFirstVisit()) {
  showView('onboarding');
} else {
  startApp();
}
