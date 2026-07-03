// app.js -- entry point for WFH Movement
import { EXERCISES } from './exercises.js';
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit, acknowledgeShieldUse, getState, saveState, localDateString } from './storage.js';
import { suggestExercise } from './rotation.js';
import { startReminderEngine, isWithinWorkWindow, getNextReminderMs } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';
import { TIER_DURATION, awardBreak, awardQuestBonus, getProgress } from './game.js';
import { getTodaysQuests, evaluateQuests } from './quests.js';
import { getSittingMinutes, recordDaySummary, getWeekStats, getAreaBalance } from './insights.js';

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
  ['view-landing', 'view-onboarding', 'view-dashboard', 'view-timer', 'view-progress'].forEach(id => {
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

// ---------------------------------------------------------------------------
// Quests, shield, sitting timer
// ---------------------------------------------------------------------------

function todayDateString() {
  return localDateString();
}

function refreshQuests() {
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  const strip = document.getElementById('quest-strip');
  if (quests.length === 0) { strip.classList.add('hidden'); return; }
  strip.classList.remove('hidden');

  const record = getTodayRecord();
  const evals = evaluateQuests(record, quests, settings);
  const cardsEl = document.getElementById('quest-cards');
  cardsEl.innerHTML = '';
  evals.forEach(q => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding: 0.9rem;';
    card.innerHTML = `
      <div style="font-weight: 700; font-size: 0.9rem;">${q.completed ? '✅ ' : ''}${q.title}</div>
      <div class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">${q.progress}/${q.target} · +${q.bonusXp} XP</div>`;
    cardsEl.appendChild(card);
  });
}

function awardNewQuestCompletions() {
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  if (quests.length === 0) return;
  const record = getTodayRecord();
  const done = new Set(record.questsDone || []);
  const evals = evaluateQuests(record, quests, settings);
  evals.filter(q => q.completed && !done.has(q.id)).forEach(q => {
    done.add(q.id);
    const r = awardQuestBonus(q.bonusXp);
    showXpToast(`Quest complete: ${q.title} +${q.bonusXp} XP${r.leveledUp ? ` · Level ${r.level}!` : ''}`);
  });
  record.questsDone = [...done];
  saveState({ ...(getState() || {}), today: record });
}

let toastTimeout = null;
function showXpToast(text) {
  const toast = document.getElementById('xp-toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateShieldAndSitting() {
  const h = getStreak();
  document.getElementById('shield-chip').classList.toggle('hidden', !h.shieldHeld);
  const note = document.getElementById('shield-note');
  if (h.shieldUsedFor) {
    const weekday = new Date(h.shieldUsedFor + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
    note.textContent = `your shield covered ${weekday}, streak safe`;
    note.classList.remove('hidden');
    acknowledgeShieldUse();
  }
  const mins = getSittingMinutes(new Date(), getSettings(), getTodayRecord());
  const line = document.getElementById('sitting-line');
  if (mins === null) {
    line.classList.add('hidden');
  } else {
    line.textContent = `Sitting for ${mins} min (since your last break)`;
    line.classList.remove('hidden');
  }
}

function startCountdownDisplay() {
  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const settings = getSettings();
    const now = new Date();
    const countdownEl = document.getElementById('next-break-countdown');
    const labelEl = document.getElementById('next-break-label');

    updateShieldAndSitting();

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
  refreshQuests();
  updateShieldAndSitting();

  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
}

// ---------------------------------------------------------------------------
// Break flow
// ---------------------------------------------------------------------------

const TIER_BUTTON_LABELS = {
  easy: '🌱 Easy · 1 min · +10 XP',
  medium: '🚶 Medium · 2 min · +20 XP',
  hard: '🔥 Hard · 3 min · +35 XP'
};
let pendingByTier = {};

function triggerBreak() {
  const streak = getStreak().streak;
  const note = document.getElementById('choice-streak-note');
  if (streak >= 1) {
    note.textContent = `keeps your ${streak}-day streak alive`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }

  // Pre-pick one exercise per tier so each button shows what you are choosing
  const record = getTodayRecord();
  pendingByTier = {};
  ['easy', 'medium', 'hard'].forEach(tier => {
    pendingByTier[tier] = suggestExercise(record.lastTargetArea, null, tier);
    const btn = document.getElementById('btn-tier-' + tier);
    btn.innerHTML = `${TIER_BUTTON_LABELS[tier]}<span style="display: block; font-weight: 600; font-size: 0.8rem; opacity: 0.85;">${pendingByTier[tier].name}</span>`;
  });

  document.getElementById('dashboard-idle').classList.add('hidden');
  document.getElementById('dashboard-active').classList.remove('hidden');
  showView('dashboard');
}

function startTierBreak(tier) {
  currentTier = tier;
  if (pendingByTier[tier]) {
    currentExercise = pendingByTier[tier];
  } else {
    const record = getTodayRecord();
    currentExercise = suggestExercise(record.lastTargetArea, null, tier);
  }
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
  logBreak(exercise.id, exercise.targetArea, currentTier);
  recordDaySummary({ date: todayDateString(), tier: currentTier, targetArea: exercise.targetArea });
  awardNewQuestCompletions();
  refreshQuests();
  showView('dashboard');
  document.getElementById('dashboard-active').classList.add('hidden');
  document.getElementById('dashboard-idle').classList.remove('hidden');
  updateDashboardStats();
  updateLevelDisplay();
  updateShieldAndSitting();
  currentTier = null;
}

// ---------------------------------------------------------------------------
// Progress view
// ---------------------------------------------------------------------------

function renderProgress() {
  const now = new Date();
  const stats = getWeekStats(now);
  document.getElementById('prog-minutes').textContent = stats.minutesMoved;
  document.getElementById('prog-streak').textContent = stats.streak;
  document.getElementById('prog-best').textContent = stats.bestStreak;

  const barsEl = document.getElementById('prog-bars');
  barsEl.innerHTML = '';
  const max = Math.max(1, ...stats.days.map(d => d.count));
  stats.days.forEach(d => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;';
    const bar = document.createElement('div');
    bar.style.cssText = `width: 100%; max-width: 28px; border-radius: 6px 6px 0 0; background: var(--color-primary); height: ${Math.max(4, (d.count / max) * 60)}px; opacity: ${d.count === 0 ? 0.2 : 1};`;
    const label = document.createElement('span');
    label.className = 'text-muted';
    label.style.fontSize = '0.7rem';
    label.textContent = new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
    wrap.appendChild(bar);
    wrap.appendChild(label);
    barsEl.appendChild(wrap);
  });

  const balance = getAreaBalance(now);
  const areasEl = document.getElementById('prog-areas');
  areasEl.innerHTML = '';
  balance.forEach(({ area, count }) => {
    const chip = document.createElement('span');
    chip.className = 'badge';
    chip.textContent = `${capitalize(area)} · ${count}`;
    if (count === 0) chip.style.opacity = '0.5';
    areasEl.appendChild(chip);
  });
  const active = balance.filter(b => b.count > 0);
  const nudgeEl = document.getElementById('prog-nudge');
  if (active.length > 0) {
    const least = [...balance].sort((a, b) => a.count - b.count)[0];
    nudgeEl.textContent = `your ${least.area === 'cardio' ? 'heart rate' : least.area} ${least.area === 'hips' || least.area === 'wrists' || least.area === 'shoulders' ? 'have' : 'has'} been patient this week`;
  } else {
    nudgeEl.textContent = 'complete a break and your week starts filling in';
  }
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

  const workDays = settings.workDays || [1, 2, 3, 4, 5];
  for (let d = 0; d < 7; d++) document.getElementById('s-wd-' + d).checked = workDays.includes(d);

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
    defaultBreakLength: document.getElementById('s-default-break').value,
    workDays: [0, 1, 2, 3, 4, 5, 6].filter(d => document.getElementById('s-wd-' + d).checked)
  };
  saveSettings(settings);
  closeSettingsModal();

  // Restart reminder engine with new settings
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(triggerBreak);
  startCountdownDisplay();
  refreshQuests();
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

document.getElementById('link-progress').addEventListener('click', (e) => {
  e.preventDefault();
  renderProgress();
  showView('progress');
});

document.getElementById('btn-back-dashboard').addEventListener('click', () => showView('dashboard'));

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
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'START_TIER') startTierBreak(data.tier);
    if (data.type === 'SHOW_CHOICE') triggerBreak();
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.getElementById('btn-start-setup-hero').addEventListener('click', () => showView('onboarding'));
document.getElementById('btn-start-setup-bottom').addEventListener('click', () => showView('onboarding'));

const rawTierParam = new URLSearchParams(window.location.search).get('tier');
const tierParam = ['easy', 'medium', 'hard'].includes(rawTierParam) ? rawTierParam : null;
if (tierParam && !isFirstVisit()) {
  startApp();
  startTierBreak(tierParam);
}

if (!tierParam || isFirstVisit()) {
  if (isFirstVisit()) {
    showView('landing');
  } else {
    startApp();
  }
}
