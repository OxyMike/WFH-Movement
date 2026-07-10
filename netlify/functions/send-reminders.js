import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { localParts, dueReminder } from '../../push-schedule.js';

// Scheduled every 5 minutes. For each stored subscriber, decide -- in THEIR
// timezone -- whether a reminder slot is due, push it, and record the slot so it
// never repeats. Prune subscriptions Apple/Google report as gone (404/410).

const SUBS = 'wfh-push-subs';

export default async () => {
  const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: 'VAPID env vars not set' }, 500);
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:mik3mz@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const store = getStore(SUBS);
  const { blobs } = await store.list();
  const now = new Date();
  let sent = 0, pruned = 0;

  for (const { key } of blobs) {
    const rec = await store.get(key, { type: 'json' });
    if (!rec?.subscription) continue;

    const { min, dow, dateStr } = localParts(now, rec.timezone || 'UTC');
    const slotKey = dueReminder(rec, dateStr, dow, min, rec.lastSentKey);
    if (!slotKey) continue;

    try {
      await webpush.sendNotification(rec.subscription, JSON.stringify({
        title: 'Time to move',
        body: 'Stand up. Roll your shoulders. Two minutes.'
      }));
      rec.lastSentKey = slotKey;
      await store.setJSON(key, rec);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await store.delete(key);
        pruned++;
      }
    }
  }
  return json({ sent, pruned, checked: blobs.length });
};

export const config = { schedule: '*/5 * * * *' };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
