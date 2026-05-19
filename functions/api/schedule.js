import { makeId, readCollection, requireAdmin, writeJson } from './_admin.js';
import { json } from './_json.js';

const DEFAULT_SCHEDULE = [
  {
    id: 'salsamix-24-7',
    dj_id: 'dj-kalenita',
    dj_name: 'DJ Kalenita',
    day_of_week: 0,
    start_time: '00:00',
    end_time: '23:59',
    show_name: 'SalsaMixLive 24/7',
    description: 'Salsa colombiana y clasicos latinos todo el dia.',
  },
  {
    id: 'ny-salsa-night',
    dj_id: 'dj-kalenita',
    dj_name: 'DJ Kalenita',
    day_of_week: 5,
    start_time: '19:00',
    end_time: '23:00',
    show_name: 'Viernes de Salsa desde NY',
    description: 'Mezcla salsera para empezar el fin de semana.',
  },
];

export async function onRequestGet({ env }) {
  const saved = env.SALSAMIX_STATS ? await env.SALSAMIX_STATS.get('admin:schedule', 'json') : null;
  return json(Array.isArray(saved) ? saved : DEFAULT_SCHEDULE);
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const item = {
    id: makeId('schedule'),
    dj_id: String(body.dj_id || ''),
    dj_name: String(body.dj_name || ''),
    day_of_week: Number(body.day_of_week || 0),
    start_time: String(body.start_time || ''),
    end_time: String(body.end_time || ''),
    show_name: String(body.show_name || '').trim(),
    description: String(body.description || ''),
  };

  if (!item.dj_id || !item.show_name || !item.start_time || !item.end_time) {
    return json({ detail: 'DJ, programa y horario son requeridos.' }, { status: 400 });
  }

  const schedule = await readCollection(auth.store, 'admin:schedule');
  schedule.push(item);
  await writeJson(auth.store, 'admin:schedule', schedule);
  return json(item);
}
