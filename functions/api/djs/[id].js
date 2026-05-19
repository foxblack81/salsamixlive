import { json, unavailable } from '../_json.js';

export async function onRequestGet({ params }) {
  if (params.id === 'dj-kalenita') {
    return json({
      id: 'dj-kalenita',
      username: 'dj-kalenita',
      email: 'info@salsamixlive.com',
      role: 'dj',
      full_name: 'DJ Kalenita',
      bio: 'Desde NY para el mundo entero, poniendo la salsa que prende SalsaMixLive.com.',
      avatar_url: '/icons/salsamixlive-hero-logo.png',
      created_at: '2026-05-19T00:00:00.000Z',
    });
  }

  return json({ detail: 'DJ not found' }, { status: 404 });
}

export async function onRequestPut() {
  return unavailable('Editar DJs');
}

export async function onRequestDelete() {
  return unavailable('Eliminar DJs');
}
