// app.js -- entry point for WFH Movement
import { EXERCISES } from './exercises.js';
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit, acknowledgeShieldUse, getState, saveState, localDateString, isWorkday, nextWorkdayName } from './storage.js';
import { suggestExercise, easierQuest } from './rotation.js';
import { startReminderEngine, getNextReminderMs } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';
import { awardBreak, awardQuestBonus, getProgress, getUnlocks, skipXpFactor } from './game.js';
import { getTodaysQuests, evaluateQuests } from './quests.js';
import { getSittingMinutes, recordDaySummary, getWeekStats, getAreaBalance } from './insights.js';
import { getFigure } from './figures.js';

// Module-level state
let snoozeTimeout = null;
let activeTimer = null;
let reminderEngine = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDateString() {
  return localDateString();
}

// ---------------------------------------------------------------------------
// View management (tabs)
// ---------------------------------------------------------------------------

const TABS = ['today', 'quests', 'calendar', 'team', 'rewards', 'progress', 'settings'];
const TAB_TITLES = {
  today: "Today's Quest Board", quests: 'Quest Library', calendar: 'Calendar',
  team: 'Team', rewards: 'Rewards', progress: 'Progress', settings: 'Settings'
};
const TAB_RENDERERS = {
  today: () => renderToday(),
  quests: () => renderLibrary(),
  rewards: () => renderRewards(),
  progress: () => renderProgress(),
  settings: () => renderSettings(),
  calendar: () => {}, team: () => {}
};

function showTab(name) {
  TABS.forEach(t => {
    document.getElementById('view-' + t).classList.toggle('active-view', t === name);
    document.querySelector(`.nav-item[data-tab="${t}"]`).classList.toggle('active', t === name);
  });
  document.getElementById('current-view-title').textContent = TAB_TITLES[name];
  TAB_RENDERERS[name]();
}

document.querySelectorAll('.nav-item[data-tab]').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));

// ---------------------------------------------------------------------------
// Quests library
// ---------------------------------------------------------------------------

let libraryFilter = 'all';

function renderLibrary() {
  const grid = document.getElementById('quests-library-container');
  const list = EXERCISES.filter(e => libraryFilter === 'all' || e.category === libraryFilter);
  grid.innerHTML = list.map(e => `
    <div class="fd-card library-card">
      <div class="quest-meta">
        <span class="quest-tag">${e.category} · ${e.tier}</span>
        <h3 class="quest-title-text">${e.name}</h3>
        <p class="quest-desc">${e.desc}</p>
      </div>
      <div class="quest-action-row">
        <span class="xp-indicator">+${e.xp} XP · ${e.duration} min</span>
        <button class="btn-primary" data-start-quest="${e.id}">Start</button>
      </div>
    </div>`).join('');
  grid.querySelectorAll('[data-start-quest]').forEach(btn =>
    btn.addEventListener('click', () => {
      const quest = EXERCISES.find(e => e.id === btn.dataset.startQuest);
      showTab('today');
      startQuest(quest);
    }));
}

document.querySelectorAll('#quests-library-filters .filter-pill').forEach(pill =>
  pill.addEventListener('click', () => {
    libraryFilter = pill.dataset.filter;
    document.querySelectorAll('#quests-library-filters .filter-pill')
      .forEach(p => p.classList.toggle('active', p === pill));
    renderLibrary();
  }));

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

function renderRewards() {
  const p = getProgress();
  document.getElementById('rewards-level-val').textContent = p.level;
  document.getElementById('rewards-level-heading').textContent = `Level ${p.level}`;
  document.getElementById('rewards-level-title').textContent = `"${p.title}"`;
  document.getElementById('rewards-unlocks-container').innerHTML = getUnlocks().map(pack => `
    <div class="unlock-item${pack.unlocked ? ' unlocked' : ''}">
      <div class="unlock-icon">${pack.unlocked ? '✅' : '🔒'}</div>
      <div class="unlock-details">
        <span class="unlock-name">${pack.label}</span>
        <span class="unlock-level-req${pack.unlocked ? ' unlocked-status' : ''}">${pack.unlocked
          ? `${pack.quests.length} quests: ${pack.quests.join(', ')}`
          : `Unlocks at level ${pack.level} · ${pack.quests.length} quests inside`}</span>
      </div>
    </div>`).join('');
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

function renderProgress() {
  const now = new Date();
  const stats = getWeekStats(now);
  const streak = getStreak();
  document.getElementById('stats-total-resets').textContent = streak.totalBreaks;
  document.getElementById('stats-total-minutes').textContent = `${stats.minutesMoved}m`;
  document.getElementById('stats-current-streak').textContent = stats.streak;

  // Adherence: workdays in the last 7 days with at least one break
  const workDays = getSettings().workDays;
  const wd = stats.days.filter(d => isWorkday(d.date, workDays));
  const adherence = wd.length === 0 ? 0 : Math.round(100 * wd.filter(d => d.count > 0).length / wd.length);
  document.getElementById('stats-adherence').textContent = `${adherence}%`;

  const balance = getAreaBalance(now);
  const active = balance.filter(b => b.count > 0).map(b => b.area);
  for (const { area } of balance) {
    document.getElementById('muscle-' + area)
      .classList.toggle('active-coverage', active.includes(area));
  }
  const label = a => ({ neck: 'Neck', shoulders: 'Shoulders', core: 'Core', wrists: 'Wrists', legs: 'Legs' }[a]);
  document.getElementById('legend-active-areas').textContent =
    active.length ? `Covered this week: ${active.map(label).join(', ')}` : 'Nothing covered yet this week';
  const idle = balance.filter(b => b.count === 0).map(b => label(b.area));
  document.getElementById('legend-focus-areas').textContent =
    idle.length ? `Waiting for attention: ${idle.join(', ')}` : 'Every zone covered. Full-body week.';
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

let settingsFixedTimes = [];

function renderSettings() {
  const s = getSettings();
  document.getElementById('settings-name-input').value = s.userName || '';
  document.getElementById('settings-work-start').value = s.workStart;
  document.getElementById('settings-work-end').value = s.workEnd;
  for (let d = 0; d < 7; d++)
    document.getElementById('settings-wd-' + d).checked = (s.workDays || [1,2,3,4,5]).includes(d);
  document.getElementById('settings-reminder-mode').value = s.reminderMode;
  document.getElementById('settings-interval-minutes').value = String(s.intervalMinutes);
  document.getElementById('settings-sound-toggle').checked = !s.muted;
  settingsFixedTimes = [];
  const list = document.getElementById('settings-fixed-times-list');
  list.innerHTML = '';
  (s.fixedTimes || []).forEach(t => addTimeChip(t, list, settingsFixedTimes));
  toggleReminderInputs(s.reminderMode);
}

function toggleReminderInputs(mode) {
  document.getElementById('settings-interval-minutes').classList.toggle('hidden', mode === 'fixed');
  document.getElementById('settings-fixed-options').classList.toggle('hidden', mode === 'interval');
}
document.getElementById('settings-reminder-mode').addEventListener('change', function () { toggleReminderInputs(this.value); });
document.getElementById('settings-add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('settings-fixed-time-input');
  addTimeChip(input.value, document.getElementById('settings-fixed-times-list'), settingsFixedTimes);
  input.value = '';
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
  saveSettings({
    userName: document.getElementById('settings-name-input').value.trim(),
    workStart: document.getElementById('settings-work-start').value,
    workEnd: document.getElementById('settings-work-end').value,
    workDays: [0,1,2,3,4,5,6].filter(d => document.getElementById('settings-wd-' + d).checked),
    reminderMode: document.getElementById('settings-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('settings-interval-minutes').value, 10),
    fixedTimes: [...settingsFixedTimes],
    muted: !document.getElementById('settings-sound-toggle').checked
  });
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(onReminderFires);
  showXpToast('Settings saved');
  updateTopBar();
  showTab('today');
});

document.getElementById('btn-reset-database').addEventListener('click', () => {
  if (window.confirm('Reset all data? This deletes your streak, XP, and history on this device. There is no undo.')) {
    resetAll();
    window.location.reload();
  }
});

// ---------------------------------------------------------------------------
// Top bar and sidebar identity
// ---------------------------------------------------------------------------

function updateTopBar() {
  const s = getSettings();
  const streak = getStreak().streak;
  document.getElementById('streak-counter-value').textContent =
    streak === 1 ? '1 day streak' : `${streak} day streak`;
  document.getElementById('audio-icon-muted').style.display = s.muted ? '' : 'none';
  document.getElementById('audio-icon-unmuted').style.display = s.muted ? 'none' : '';
  const name = s.userName || 'You';
  document.getElementById('sidebar-username').textContent = name;
  document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('sidebar-level-title').textContent = getProgress().title;
}

document.getElementById('audio-mute-btn').addEventListener('click', () => {
  const s = getSettings();
  saveSettings({ ...s, muted: !s.muted });
  updateTopBar();
});

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const POSITIVE_QUOTES = [
  "Steady beats fast. A short break now keeps you going all afternoon.",
  "A few slow breaths tell your nervous system the emergency is over.",
  "This body is the only one you get. Two minutes of care is not much to ask.",
  "Taking care of yourself is part of doing a good job.",
  "Rest is not a reward you earn. It is what lets the rest of the day work.",
  "Even a ten-second stretch shifts what is happening in your muscles.",
  "Your worth today has nothing to do with hours logged at the screen.",
  "Step away for a minute and check in with your posture, your feet, your breath."
];

function initQuote() {
  const el = document.getElementById('dashboard-quote-text');
  el.textContent = `"${POSITIVE_QUOTES[new Date().getDate() % POSITIVE_QUOTES.length]}"`;
}

document.getElementById('btn-quote-shuffle').addEventListener('click', () => {
  const el = document.getElementById('dashboard-quote-text');
  const current = el.textContent.replace(/"/g, '');
  const pool = POSITIVE_QUOTES.filter(q => q !== current);
  el.textContent = `"${pool[Math.floor(Math.random() * pool.length)]}"`;
});

// ---------------------------------------------------------------------------
// Today view
// ---------------------------------------------------------------------------

let suggestedQuest = null;

function renderToday() {
  const settings = getSettings();
  const record = getTodayRecord();
  const name = settings.userName;
  const h = new Date().getHours();
  const dayPart = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashboard-greeting').textContent = name ? `${dayPart}, ${name}` : dayPart;
  initQuote();

  const mins = getSittingMinutes(new Date(), settings, record);
  document.getElementById('dashboard-sitting-duration').textContent =
    mins !== null ? `Sitting ${mins} min since your last break.` : 'Your chair misses you already. Good.';
  document.getElementById('today-seated-timer').textContent = mins !== null ? `${mins} min` : 'Fresh start';

  if (!suggestedQuest) suggestedQuest = suggestExercise(record.lastTargetArea, null, null);
  renderPrimaryQuest();
  renderDailyQuests();
  tickToday();
}

function renderPrimaryQuest() {
  document.getElementById('primary-quest-title').textContent = suggestedQuest.name;
  document.getElementById('primary-quest-description').textContent = suggestedQuest.desc;
  document.getElementById('primary-quest-time').textContent = `${suggestedQuest.duration} min`;
  document.getElementById('primary-quest-xp').textContent = `+${suggestedQuest.xp} XP`;
  document.getElementById('primary-quest-insight').textContent = suggestedQuest.desc;
}

document.getElementById('btn-reroll-quest').addEventListener('click', () => {
  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, suggestedQuest?.id, null);
  renderPrimaryQuest();
});
document.getElementById('btn-start-quest').addEventListener('click', () => startQuest(suggestedQuest));

function startSuggestedQuest() {
  if (!suggestedQuest) suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  startQuest(suggestedQuest);
}

// ---------------------------------------------------------------------------
// Reminder path and snooze
// ---------------------------------------------------------------------------

function onReminderFires() {
  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  showTab('today');
  const card = document.getElementById('primary-suggested-card');
  card.classList.remove('quest-pulse');
  void card.offsetWidth; // restart the animation
  card.classList.add('quest-pulse');
  document.getElementById('btn-snooze-quest').classList.remove('hidden');
}

document.getElementById('btn-snooze-quest').addEventListener('click', snoozeReminder);
function snoozeReminder() {
  document.getElementById('btn-snooze-quest').classList.add('hidden');
  if (snoozeTimeout) clearTimeout(snoozeTimeout);
  snoozeTimeout = setTimeout(onReminderFires, 15 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Live quest widget (break flow)
// ---------------------------------------------------------------------------

let liveQuest = null, liveRemaining = 0, livePaused = false, liveStepIdx = -1;

function sound(freq, ms) {
  if (!getSettings().muted) playTone(freq, ms);
}

function stepAtElapsed(quest, elapsed) {
  let acc = 0;
  for (let i = 0; i < quest.steps.length; i++) {
    acc += quest.steps[i].duration;
    if (elapsed < acc) return i;
  }
  return quest.steps.length - 1;
}

function startQuest(quest) {
  liveQuest = quest;
  liveStepIdx = -1;
  livePaused = false;
  document.getElementById('btn-live-pause').textContent = 'Pause';
  document.getElementById('btn-live-easier').classList.toggle('hidden', !easierQuest(quest));
  if (snoozeTimeout) { clearTimeout(snoozeTimeout); snoozeTimeout = null; }
  document.body.classList.add('break-active');
  document.getElementById('btn-snooze-quest').classList.add('hidden');
  document.getElementById('live-quest-widget').classList.remove('hidden');
  document.getElementById('live-quest-widget-header').textContent = 'Live Desk Quest';
  runLiveTimer(quest.duration * 60);
}

function runLiveTimer(seconds) {
  if (activeTimer) activeTimer.stop();
  const total = liveQuest.duration * 60;
  activeTimer = startTimer(seconds, (remaining) => {
    liveRemaining = remaining;
    document.getElementById('live-timer-countdown').textContent = formatTime(remaining);
    const CIRC = 377; // 2 * PI * r, r=60 from the svg
    document.getElementById('timer-progress-circle').style.strokeDashoffset =
      String(CIRC * (1 - remaining / total));
    const idx = stepAtElapsed(liveQuest, total - remaining);
    if (idx !== liveStepIdx) { liveStepIdx = idx; renderLiveStep(); if (idx > 0) sound(523, 150); }
  }, completeQuest);
}

function renderLiveStep() {
  const step = liveQuest.steps[liveStepIdx];
  document.getElementById('live-quest-movement-title').textContent = step.title;
  document.getElementById('live-quest-movement-desc').textContent = step.desc;
  const ill = document.getElementById('live-quest-illustration-container');
  ill.innerHTML = getFigure(step.svg);
  ill.className = step.animation || '';
  const dots = document.getElementById('live-quest-dots');
  dots.innerHTML = liveQuest.steps
    .map((_, i) => `<div class="step-dot${i <= liveStepIdx ? ' active' : ''}"></div>`).join('');
}

document.getElementById('btn-live-pause').addEventListener('click', function () {
  if (!liveQuest) { startSuggestedQuest(); return; } // resting: this button reads "Start"
  if (!livePaused) { activeTimer.stop(); livePaused = true; this.textContent = 'Resume'; }
  else { livePaused = false; this.textContent = 'Pause'; runLiveTimer(liveRemaining); }
});
document.getElementById('btn-live-skip').addEventListener('click', () => {
  if (!liveQuest) return;
  if (activeTimer) activeTimer.stop();
  completeQuest(skipXpFactor(liveRemaining, liveQuest.duration * 60)); // half XP if past halfway, else none
});
document.getElementById('btn-live-easier').addEventListener('click', () => {
  if (!liveQuest) return;
  const easier = easierQuest(liveQuest);
  if (easier) startQuest(easier);
});

function completeQuest(xpFactor = 1) {
  const quest = liveQuest;
  liveQuest = null;
  document.body.classList.remove('break-active');

  if (xpFactor > 0) {
    sound(659, 300); setTimeout(() => sound(784, 400), 350);
    logBreak(quest.id, quest.targetArea, quest.tier);
    recordDaySummary({ date: todayDateString(), minutes: quest.duration * xpFactor, targetArea: quest.targetArea });
    const result = awardBreak(Math.round(quest.xp * xpFactor));
    showXpToast(`+${result.xpGained} XP${xpFactor < 1 ? ' (partial)' : ''}${result.leveledUp ? ` · Level ${result.level}: ${result.title}` : ''}`);
    if (result.leveledUp) setTimeout(() => sound(880, 400), 750);
    awardNewQuestCompletions();
  }

  suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  showTab('today');
  updateRail();
  updateTopBar();
}

// ---------------------------------------------------------------------------
// The rail (XP bar + shield + resting widget)
// ---------------------------------------------------------------------------

function restingHeaderText() {
  const ms = getNextReminderMs(getSettings());
  return ms === null ? 'Off the clock' : `Next quest in ${Math.max(1, Math.round(ms / 60000))} min`;
}

function renderRestingRail() {
  if (liveQuest) return;
  document.getElementById('live-quest-widget-header').textContent = restingHeaderText();
  document.getElementById('btn-live-pause').textContent = 'Start';
  if (!suggestedQuest) suggestedQuest = suggestExercise(getTodayRecord().lastTargetArea, null, null);
  const step = suggestedQuest.steps[0];
  const ill = document.getElementById('live-quest-illustration-container');
  ill.innerHTML = getFigure(step.svg);
  ill.className = ''; // static: no animation between quests
  document.getElementById('live-quest-movement-title').textContent = suggestedQuest.name;
  document.getElementById('live-quest-movement-desc').textContent = step.desc;
  document.getElementById('live-timer-countdown').textContent = formatTime(suggestedQuest.duration * 60);
  document.getElementById('timer-progress-circle').style.strokeDashoffset = '0';
  document.getElementById('live-quest-dots').innerHTML =
    suggestedQuest.steps.map(() => '<div class="step-dot"></div>').join('');
}

function updateRail() {
  const p = getProgress();
  document.getElementById('level-display-label').textContent = `Level ${p.level} · ${p.title}`;
  document.getElementById('xp-display-label').textContent =
    p.xpForNext === null ? `${p.xp} XP · max level` : `${p.xpIntoLevel} / ${p.xpForNext} XP`;
  document.getElementById('xp-progress-fill-bar').style.width =
    p.xpForNext === null ? '100%' : `${Math.min(100, (p.xpIntoLevel / p.xpForNext) * 100)}%`;

  const h = getStreak();
  const card = document.getElementById('shield-card');
  const desc = document.getElementById('shield-desc-text');
  card.classList.toggle('shield-inactive', !h.shieldHeld);
  if (h.shieldUsedFor) {
    const weekday = new Date(h.shieldUsedFor + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
    desc.textContent = `Your shield covered ${weekday}. Streak safe.`;
    acknowledgeShieldUse();
  } else {
    desc.textContent = h.shieldHeld
      ? 'Protects your streak for one missed day'
      : 'Earn one with a 5-day streak';
  }

  renderRestingRail();
}

// ---------------------------------------------------------------------------
// 10-second Today refresh
// ---------------------------------------------------------------------------

function tickToday() {
  const settings = getSettings();
  const record = getTodayRecord();
  const mins = getSittingMinutes(new Date(), settings, record);
  document.getElementById('dashboard-sitting-duration').textContent =
    mins !== null ? `Sitting ${mins} min since your last break.` : 'Your chair misses you already. Good.';
  document.getElementById('today-seated-timer').textContent = mins !== null ? `${mins} min` : 'Fresh start';
  const ms = getNextReminderMs(settings);
  document.getElementById('next-break-line').textContent =
    ms === null ? 'Off the clock' : `Next break in ${Math.max(1, Math.round(ms / 60000))} min`;
  if (!liveQuest) document.getElementById('live-quest-widget-header').textContent = restingHeaderText();
}

let todayTicker = null;
function startTodayTicker() {
  if (todayTicker) clearInterval(todayTicker);
  todayTicker = setInterval(tickToday, 10000);
}

// ---------------------------------------------------------------------------
// Quests, XP toast
// ---------------------------------------------------------------------------

function renderDailyQuests() {
  const container = document.getElementById('daily-quests-board-container');
  container.innerHTML = '';
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  if (quests.length === 0) {
    const day = nextWorkdayName(todayDateString(), settings.workDays);
    const note = document.createElement('p');
    note.className = 'daily-quests-rest-note';
    note.textContent = day ? `Rest day, earned. New quests arrive ${day}.` : 'Rest day, earned.';
    container.appendChild(note);
    return;
  }

  const record = getTodayRecord();
  const evals = evaluateQuests(record, quests, settings);
  evals.forEach(q => {
    const item = document.createElement('div');
    item.className = 'fd-card daily-quest-item';
    item.innerHTML = `
      <div class="daily-quest-top">
        <span class="daily-quest-name">${q.title}</span>
        <span class="daily-quest-status-bullet ${q.completed ? 'completed' : ''}"></span>
      </div>
      <div class="daily-quest-bottom">
        <span class="daily-quest-xp">+${q.bonusXp} XP</span>
        <span class="daily-quest-progress-label">${q.progress}/${q.target}</span>
      </div>`;
    container.appendChild(item);
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

// ---------------------------------------------------------------------------
// Shared chip helper (onboarding + settings fixed-time lists)
// ---------------------------------------------------------------------------

function addTimeChip(time, listEl, timesArray) {
  if (!time || timesArray.includes(time)) return;
  timesArray.push(time);

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = time;
  chip.title = 'Click to remove';
  chip.addEventListener('click', () => {
    const idx = timesArray.indexOf(time);
    if (idx !== -1) timesArray.splice(idx, 1);
    chip.remove();
  });
  listEl.appendChild(chip);
}

// ---------------------------------------------------------------------------
// Onboarding wizard state machine
// ---------------------------------------------------------------------------

const WIZARD_SLIDES = ['obs-1', 'obs-2', 'obs-3', 'obs-4'];
let wizardIdx = 0;
let onboardingFixedTimes = [];

function showWizardSlide(i) {
  wizardIdx = i;
  WIZARD_SLIDES.forEach((id, n) =>
    document.getElementById(id).classList.toggle('active-slide', n === i));
  document.getElementById('btn-ob-back').classList.toggle('hidden', i === 0);
  document.getElementById('btn-ob-next').classList.toggle('hidden', i === WIZARD_SLIDES.length - 1);
  document.getElementById('btn-ob-finish').classList.toggle('hidden', i !== WIZARD_SLIDES.length - 1);
}

document.getElementById('btn-ob-next').addEventListener('click', () => showWizardSlide(wizardIdx + 1));
document.getElementById('btn-ob-back').addEventListener('click', () => showWizardSlide(wizardIdx - 1));
document.getElementById('btn-ob-close').addEventListener('click', () => {
  document.getElementById('onboarding-wizard').classList.remove('active');
});

document.getElementById('ob-reminder-mode').addEventListener('change', function () {
  const fixed = this.value === 'fixed';
  document.getElementById('ob-interval-minutes').classList.toggle('hidden', fixed);
  document.getElementById('ob-fixed-options').classList.toggle('hidden', !fixed);
});

document.getElementById('ob-add-fixed-time').addEventListener('click', () => {
  const input = document.getElementById('ob-fixed-time-input');
  addTimeChip(input.value, document.getElementById('ob-fixed-times-list'), onboardingFixedTimes);
  input.value = '';
});

function completeOnboarding() {
  saveSettings({
    userName: document.getElementById('ob-name-input').value.trim(),
    workStart: document.getElementById('ob-work-start').value,
    workEnd: document.getElementById('ob-work-end').value,
    workDays: [0,1,2,3,4,5,6].filter(d => document.getElementById('ob-wd-' + d).checked),
    reminderMode: document.getElementById('ob-reminder-mode').value,
    intervalMinutes: parseInt(document.getElementById('ob-interval-minutes').value, 10),
    fixedTimes: [...onboardingFixedTimes],
    muted: false
  });
  if ('Notification' in window) Notification.requestPermission().catch(() => {});
  document.getElementById('onboarding-wizard').classList.remove('active');
  startApp();
}
document.getElementById('btn-ob-finish').addEventListener('click', completeOnboarding);

// ---------------------------------------------------------------------------
// Boot logic
// ---------------------------------------------------------------------------

function startApp() {
  document.getElementById('view-landing').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  showTab('today');
  updateTopBar();
  updateRail();
  startTodayTicker();
  if (reminderEngine) reminderEngine.stop();
  reminderEngine = startReminderEngine(onReminderFires);
}

document.getElementById('btn-start-setup-hero').addEventListener('click', openWizard);
document.getElementById('btn-start-setup-bottom').addEventListener('click', openWizard);
function openWizard() {
  document.getElementById('onboarding-wizard').classList.add('active');
  showWizardSlide(0);
}

const bootParam = new URLSearchParams(window.location.search).get('break');
if (isFirstVisit()) {
  document.getElementById('view-landing').classList.remove('hidden');
  document.getElementById('onboarding-wizard').classList.remove('active');
} else {
  startApp();
  if (bootParam === 'start') startSuggestedQuest();
}

// ---------------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------------

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'START_SUGGESTED') startSuggestedQuest();
    if (data.type === 'SNOOZE') snoozeReminder();
    if (data.type === 'SHOW_CHOICE') onReminderFires();
  });
}
