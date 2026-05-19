import { getNewYorkDate, getStats, getStatsStore, incrementNumber, json } from './_stats.js';

export async function onRequestPost({ request, env }) {
  const store = getStatsStore(env);

  if (!store) {
    return json({ success: false, error: 'Stats storage is not configured' }, { status: 503 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const visitorId = String(body.visitor_id || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  const today = getNewYorkDate();
  const now = new Date().toISOString();
  const visitorKey = `visitor:${visitorId}`;

  const existingVisitor = await store.get(visitorKey);

  await Promise.all([
    incrementNumber(store, 'stats:total_visits'),
    incrementNumber(store, `stats:daily:${today}`),
    store.put(visitorKey, now),
  ]);

  if (!existingVisitor) {
    await incrementNumber(store, 'stats:unique_visitors');
  }

  const stats = await getStats(env);

  return json({
    success: true,
    visitor_id: visitorId,
    ...stats,
  });
}
