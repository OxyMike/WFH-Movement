import { getStore } from '@netlify/blobs';

// POST { subscription, schedule, timezone }  -> save/replace this browser's reminder record
// DELETE { endpoint }                        -> remove it (toggle off / unsubscribe)
// Same-origin only; the push endpoint is the identity, so no auth.

const SUBS = 'wfh-push-subs';

async function endpointKey(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Whitelist only scheduling fields -- nothing else about the user is stored.
function pickSchedule(s = {}) {
  return {
    workStart: String(s.workStart || '08:00'),
    workEnd: String(s.workEnd || '17:00'),
    workDays: Array.isArray(s.workDays) ? s.workDays.map(Number) : [1, 2, 3, 4, 5],
    reminderMode: s.reminderMode === 'fixed' ? 'fixed' : 'interval',
    intervalMinutes: Number(s.intervalMinutes) || 45,
    fixedTimes: Array.isArray(s.fixedTimes) ? s.fixedTimes.map(String) : []
  };
}

export default async (req) => {
  const store = getStore(SUBS);

  if (req.method === 'DELETE') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    if (!body?.endpoint) return json({ error: 'missing endpoint' }, 400);
    await store.delete(await endpointKey(body.endpoint));
    return json({ ok: true });
  }

  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const { subscription, schedule, timezone } = body || {};
  if (!subscription?.endpoint || !subscription?.keys) return json({ error: 'missing subscription' }, 400);

  await store.setJSON(await endpointKey(subscription.endpoint), {
    subscription,
    ...pickSchedule(schedule),
    timezone: typeof timezone === 'string' ? timezone : 'UTC',
    lastSentKey: null
  });
  return json({ ok: true });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
