import { makeId, readCollection, requireAdmin, writeJson } from './_admin.js';
import { incrementNumber, json } from './visitors/_stats.js';

const DEFAULT_ADS = [
  {
    id: 'salsamixlive-dj-kalenita',
    title: 'DJ Kalenita desde NY',
    description: 'Para el mundo entero. SalsaMixLive.com en vivo 24/7.',
    image_url: '/icons/salsamixlive-hero-logo.png',
    link_url: 'https://www.salsamixlive.com/player',
    is_active: true,
    order: 1,
    created_at: '2026-05-19T00:00:00.000Z',
  },
  {
    id: 'anunciate-salsamixlive',
    title: 'Anuncia tu negocio aqui',
    description: 'Publicidad para negocios locales, eventos y comunidad latina en New York.',
    image_url: '/icons/salsamixlive-hero-logo.png',
    link_url: 'mailto:info@salsamixlive.com?subject=Publicidad%20SalsaMixLive',
    is_active: true,
    order: 2,
    created_at: '2026-05-19T00:00:00.000Z',
  },
];

async function saveAdCounts(env, ads) {
  if (!env.SALSAMIX_STATS) return;
  const activeCount = ads.filter((ad) => ad.is_active).length;
  await env.SALSAMIX_STATS.put('ads:active_count', String(activeCount));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active_only') !== 'false';
  const saved = env.SALSAMIX_STATS ? await env.SALSAMIX_STATS.get('admin:advertisements', 'json') : null;
  const source = Array.isArray(saved) ? saved : DEFAULT_ADS;
  const ads = activeOnly ? source.filter((ad) => ad.is_active) : source;

  await saveAdCounts(env, ads);

  return json(ads);
}

export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.ad_id && Object.keys(body).length <= 1) {
    if (!env.SALSAMIX_STATS) return json({ success: false, error: 'Stats storage is not configured' }, { status: 503 });
    const value = await incrementNumber(env.SALSAMIX_STATS, 'stats:ad_impressions');
    return json({ success: true, ad_impressions: value });
  }

  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const ad = {
    id: makeId('ad'),
    title: String(body.title || '').trim(),
    description: String(body.description || ''),
    image_url: String(body.image_url || '').trim(),
    link_url: String(body.link_url || '').trim(),
    is_active: body.is_active !== false,
    order: Number(body.order || 0),
    created_at: new Date().toISOString(),
  };

  if (!ad.title || !ad.image_url) {
    return json({ detail: 'Titulo e imagen son requeridos.' }, { status: 400 });
  }

  const ads = await readCollection(auth.store, 'admin:advertisements');
  ads.push(ad);
  ads.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  await writeJson(auth.store, 'admin:advertisements', ads);
  await saveAdCounts(env, ads);
  return json(ad);
}
