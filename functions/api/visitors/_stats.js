const BASE_STATS = {
  total_visits: 30000,
  unique_visitors: 12500,
  today_visits: 150,
  ad_impressions: 0,
};

export function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

export function getStatsStore(env) {
  return env.SALSAMIX_STATS;
}

export function getNewYorkDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function readNumber(store, key, fallback = 0) {
  const value = await store.get(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function incrementNumber(store, key, amount = 1) {
  const nextValue = (await readNumber(store, key)) + amount;
  await store.put(key, String(nextValue));
  return nextValue;
}

export async function getStats(env) {
  const store = getStatsStore(env);

  if (!store) {
    return {
      ...BASE_STATS,
      active_ads: 0,
      storage: 'unavailable',
    };
  }

  const today = getNewYorkDate();
  const [total, unique, todayCount, adImpressions, activeAds] = await Promise.all([
    readNumber(store, 'stats:total_visits'),
    readNumber(store, 'stats:unique_visitors'),
    readNumber(store, `stats:daily:${today}`),
    readNumber(store, 'stats:ad_impressions'),
    readNumber(store, 'ads:active_count'),
  ]);

  return {
    total_visits: BASE_STATS.total_visits + total,
    unique_visitors: BASE_STATS.unique_visitors + unique,
    today_visits: BASE_STATS.today_visits + todayCount,
    active_ads: activeAds,
    ad_impressions: BASE_STATS.ad_impressions + adImpressions,
  };
}
