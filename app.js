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
// Stubs -- Tasks 8/9 fill these in
// ---------------------------------------------------------------------------

function renderToday() { /* Task 8/9 fills this in */ }
function renderLibrary() { /* Task 8/9 fills this in */ }
function renderRewards() { /* Task 8/9 fills this in */ }
function renderProgress() { /* Task 8/9 fills this in */ }
function renderSettings() { /* Task 8/9 fills this in */ }
function updateTopBar() { /* Task 8/9 fills this in */ }
function updateRail() { /* Task 8/9 fills this in */ }
function onReminderFires() { /* Task 8/9 fills this in */ }
function startSuggestedQuest() { /* Task 8/9 fills this in */ }

// ---------------------------------------------------------------------------
// Quests, XP toast
// ---------------------------------------------------------------------------

function refreshQuests() {
  const settings = getSettings();
  const quests = getTodaysQuests(todayDateString(), settings);
  if (quests.length === 0) return;

  const record = getTodayRecord();
  evaluateQuests(record, quests, settings);
  // Task 8 adapts this into the daily-quests-board-container rendering.
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
