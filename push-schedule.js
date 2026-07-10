// push-schedule.js -- pure, timezone-aware reminder scheduling for the server.
// Runs in browser, Node, and Netlify Functions (no DOM, no server-local Date math).
// The scheduler decides who is due in THEIR own timezone and dedups per slot.

export function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Wall-clock for `now` (a UTC instant) in the given IANA timezone.
// Returns minute-of-day, weekday (0=Sun), and local YYYY-MM-DD.
export function localParts(now, tz) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map(x => [x.type, x.value]));
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0; // some engines emit '24' at local midnight
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`,
    dow: WEEKDAYS.indexOf(p.weekday),
    min: hour * 60 + parseInt(p.minute, 10)
  };
}

// Returns the slot key to send now, or null. The key = localDate + 'T' + slotMinute;
// the caller persists it as lastSentKey so the same slot never fires twice.
// ceiling: 5-min cron granularity -- an interval under 5 min could skip a slot.
export function dueReminder(settings, localDateStr, localDow, nowMin, lastSentKey) {
  if (!(settings.workDays || []).includes(localDow)) return null;
  const start = toMinutes(settings.workStart);
  const end = toMinutes(settings.workEnd);
  if (nowMin < start || nowMin >= end) return null;

  let slot = null;
  if (settings.reminderMode === 'fixed') {
    const past = (settings.fixedTimes || [])
      .map(toMinutes)
      .filter(m => m >= start && m < end && m <= nowMin);
    if (past.length) slot = Math.max(...past);
  } else {
    const iv = settings.intervalMinutes;
    if (iv > 0 && nowMin >= start + iv) {
      slot = start + Math.floor((nowMin - start) / iv) * iv;
    }
  }
  if (slot === null) return null;

  const key = `${localDateStr}T${slot}`;
  return key === lastSentKey ? null : key;
}

// Notification text for a due reminder. Picks a real exercise from the library,
// varied by slot so back-to-back reminders differ. The server has no access to
// the user's personalized suggestion (that state stays on the device), so this
// is a real-but-generic pick; tapping the notification opens the app, which
// shows the personalized recommendation.
export function reminderContent(exercises, slotKey) {
  if (!exercises || !exercises.length) {
    return { title: 'Time to move', body: 'Stand up and stretch. Two minutes.' };
  }
  // Rotate on the slot minute (varies every reminder) plus a per-day offset
  // (so the same clock slot isn't the same exercise every day).
  const [dateStr = '', slotStr = '0'] = String(slotKey).split('T');
  const slotMin = parseInt(slotStr, 10) || 0;
  let dayOffset = 0;
  for (const c of dateStr) dayOffset = (dayOffset * 31 + c.charCodeAt(0)) >>> 0;
  const q = exercises[(slotMin + dayOffset) % exercises.length];
  return { title: 'Time to move', body: `${q.name} · ${q.duration} min. ${q.desc}` };
}
