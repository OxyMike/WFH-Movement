// app.js -- entry point for WFH Movement
import { EXERCISES } from './exercises.js';
import { getSettings, saveSettings, getTodayRecord, logBreak, getStreak, resetAll, isFirstVisit, acknowledgeShieldUse, getState, saveState, localDateString } from './storage.js';
import { suggestExercise } from './rotation.js';
import { startReminderEngine, isWithinWorkWindow, getNextReminderMs } from './reminder.js';
import { startTimer, playTone, formatTime } from './timer.js';
import { awardBreak, awardQuestBonus, getProgress } from './game.js';
import { getTodaysQuests, evaluateQuests } from './quests.js';
import { getSittingMinutes, recordDaySummary, getWeekStats, getAreaBalance } from './insights.js';
import { getFigure } from './figures.js';

// Module-level state
let currentExercise = null;
let currentTier = null;
let snoozeTimeout = null;
let activeTimer = null;
let reminderEngine = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function todayDateString() {
  return localDateString();
}

// ---------------------------------------------------------------------------
// View management (tabs)
// ---------------------------------------------------------------------------

const TABS = ['today', 'quests', 'calendar', 'team', 'rewards', 'progress', 'settings'];
const TAB_TITLES = {
  today: "Today's Quest Board", quests: 'Quests Library', calendar: 'Calendar',
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
// Stubs -- Task 9 fills these in
// ---------------------------------------------------------------------------

function renderLibrary() { /* Task 8/9 fills this in */ }
function renderRewards() { /* Task 8/9 fills this in */ }
function renderProgress() { /* Task 8/9 fills this in */ }
function renderSettings() { /* Task 8/9 fills this in */ }
function updateTopBar() { /* Task 8/9 fills this in */ }

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const POSITIVE_QUOTES = [
  "Sustainable momentum is better than constant speed. Breathe.",
  "Deep breaths are like little love notes to your nervous system.",
  "Your body is your only home; give it a 2-minute break.",
  "Taking care of yourself is part of doing a good job.",
  "Pace your day. Rest is not a reward, it is a prerequisite.",
  "Even a 10-second stretch changes the chemistry of your body.",
  "Your value is not determined by your screen time today.",
  "Disconnect to reconnect with your posture, feet, and breath."
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
  if (!liveQuest) return;
  if (!livePaused) { activeTimer.stop(); livePaused = true; this.textContent = 'Resume'; }
  else { livePaused = false; this.textContent = 'Pause'; runLiveTimer(liveRemaining); }
});
document.getElementById('btn-live-skip').addEventListener('click', () => {
  if (!liveQuest) return;
  if (activeTimer) activeTimer.stop();
  completeQuest();
});

function completeQuest() {
  const quest = liveQuest;
  liveQuest = null;
  document.body.classList.remove('break-active');
  document.getElementById('btn-live-pause').textContent = 'Pause';
  sound(659, 300); setTimeout(() => sound(784, 400), 350);

  logBreak(quest.id, quest.targetArea, quest.tier);
  recordDaySummary({ date: todayDateString(), minutes: quest.duration, targetArea: quest.targetArea });
  const result = awardBreak(quest.xp);
  showXpToast(`+${result.xpGained} XP${result.leveledUp ? ` · Level ${result.level}: ${result.title}` : ''}`);
  if (result.leveledUp) setTimeout(() => sound(880, 400), 750);
  awardNewQuestCompletions();

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
  if (quests.length === 0) return;

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
    // Task 9 rewires these against the new quest/timer flow.
    if (data.type === 'START_TIER') { /* no-op until Task 9 */ }
    if (data.type === 'SHOW_CHOICE') { /* no-op until Task 9 */ }
  });
}
