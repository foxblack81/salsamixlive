import { deleteItem, readCollection, requireAdmin } from '../_admin.js';
import { json } from '../_json.js';

export async function onRequestGet({ env, params }) {
  const saved = env.SALSAMIX_STATS ? await readCollection(env.SALSAMIX_STATS, 'admin:djs') : [];
  const found = saved.find((dj) => dj.id === params.id);
  if (found) return json(found);

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

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const djs = await readCollection(auth.store, 'admin:djs');
  const index = djs.findIndex((dj) => dj.id === params.id);
  if (index < 0) return json({ detail: 'DJ not found' }, { status: 404 });

  const body = await request.json();
  djs[index] = {
    ...djs[index],
    ...Object.fromEntries(
      Object.entries(body).filter(([key]) => ['username', 'email', 'full_name', 'bio', 'avatar_url'].includes(key)),
    ),
  };

  await auth.store.put('admin:djs', JSON.stringify(djs));
  return json(djs[index]);
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const deleted = await deleteItem(auth.store, 'admin:djs', params.id);
  return deleted ? json({ message: 'DJ deleted successfully' }) : json({ detail: 'DJ not found' }, { status: 404 });
}
