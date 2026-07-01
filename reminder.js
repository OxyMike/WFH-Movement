// reminder.js
import { getSettings } from './storage.js';

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinWorkWindow(settings, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(settings.workStart);
  const endMinutes = timeToMinutes(settings.workEnd);
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function getNextReminderMs(settings, now = new Date()) {
  if (!isWithinWorkWindow(settings, now)) return null;

  const currentMs = now.getTime();

  if (settings.reminderMode === 'fixed') {
    const todayTimes = settings.fixedTimes.map(t => {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }).filter(t => t > currentMs);

    if (todayTimes.length === 0) return null;
    return Math.min(...todayTimes) - currentMs;
  }

  // Interval mode: find ms until next interval boundary from work start
  const startOfDay = new Date(now);
  const [sh, sm] = settings.workStart.split(':').map(Number);
  startOfDay.setHours(sh, sm, 0, 0);
  const msFromStart = currentMs - startOfDay.getTime();
  const intervalMs = settings.intervalMinutes * 60 * 1000;
  const msUntilNext = intervalMs - (msFromStart % intervalMs);
  return msUntilNext;
}

export function startReminderEngine(onReminder) {
  let timeoutId = null;

  function scheduleSwNotification(ms) {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          delayMs: ms,
          title: 'Time to move',
          body: 'Your next movement break is ready. Work For Health.'
        });
      }
    });
  }

  function schedule() {
    const settings = getSettings();
    const ms = getNextReminderMs(settings);

    if (ms === null) {
      timeoutId = setTimeout(schedule, 60 * 1000);
      return;
    }

    scheduleSwNotification(ms);

    timeoutId = setTimeout(() => {
      onReminder();
      schedule();
    }, ms);
  }

  schedule();
  return { stop: () => clearTimeout(timeoutId) };
}
