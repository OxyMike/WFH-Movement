// lifelog.js -- pure block-status logic for the Today movement timeline.
// Derives 15-minute block statuses from the user's work window + real break times.
// Statuses map straight to CSS classes: 'active' (a break landed here),
// 'sedentary' (past work-block, no break), 'away' (still upcoming today).

// Minutes-of-day for an "HH:MM" string.
export function parseHM(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

// startMin/endMin: work window in minutes-of-day. nowMin: current minute-of-day.
// breakMins: array of minute-of-day values for today's completed breaks.
// Returns one {start, end, status} per 15-min block across the window.
export function lifelogStatuses(startMin, endMin, nowMin, breakMins) {
  const span = Math.max(0, endMin - startMin);
  const blocks = Math.ceil(span / 15);
  const out = [];
  for (let i = 0; i < blocks; i++) {
    const start = startMin + i * 15;
    const end = start + 15;
    let status;
    if (start >= nowMin) status = 'away';                              // upcoming
    else if (breakMins.some(m => m >= start && m < end)) status = 'active'; // break landed here
    else status = 'sedentary';                                        // past, no break
    out.push({ start, end, status });
  }
  return out;
}
