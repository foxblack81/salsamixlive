import { json } from './_json.js';

const DEFAULT_DJS = [
  {
    id: 'dj-kalenita',
    username: 'dj-kalenita',
    email: 'info@salsamixlive.com',
    role: 'dj',
    full_name: 'DJ Kalenita',
    bio: 'Desde NY para el mundo entero, poniendo la salsa que prende SalsaMixLive.com.',
    avatar_url: '/icons/salsamixlive-hero-logo.png',
    created_at: '2026-05-19T00:00:00.000Z',
  },
];

export async function onRequestGet({ env }) {
  const saved = env.SALSAMIX_STATS ? await env.SALSAMIX_STATS.get('admin:djs', 'json') : null;
  return json(Array.isArray(saved) ? saved : DEFAULT_DJS);
}
