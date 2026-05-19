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
  const ads = activeOnly ? DEFAULT_ADS.filter((ad) => ad.is_active) : DEFAULT_ADS;

  await saveAdCounts(env, ads);

  return json(ads);
}

export async function onRequestPost({ env }) {
  if (env.SALSAMIX_STATS) {
    const value = await incrementNumber(env.SALSAMIX_STATS, 'stats:ad_impressions');
    return json({ success: true, ad_impressions: value });
  }

  return json({ success: false, error: 'Stats storage is not configured' }, { status: 503 });
}
