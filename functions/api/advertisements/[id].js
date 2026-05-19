import { deleteItem, readCollection, requireAdmin, writeJson } from '../_admin.js';
import { json } from '../_json.js';

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const ads = await readCollection(auth.store, 'admin:advertisements');
  const index = ads.findIndex((ad) => ad.id === params.id);
  if (index < 0) return json({ detail: 'Advertisement not found' }, { status: 404 });

  const body = await request.json();
  const allowed = ['title', 'description', 'image_url', 'link_url', 'is_active', 'order'];
  for (const key of allowed) {
    if (key in body) ads[index][key] = key === 'order' ? Number(body[key] || 0) : body[key];
  }

  ads.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  await writeJson(auth.store, 'admin:advertisements', ads);
  await auth.store.put('ads:active_count', String(ads.filter((ad) => ad.is_active).length));
  return json(ads.find((ad) => ad.id === params.id));
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const deleted = await deleteItem(auth.store, 'admin:advertisements', params.id);
  const ads = await readCollection(auth.store, 'admin:advertisements');
  await auth.store.put('ads:active_count', String(ads.filter((ad) => ad.is_active).length));
  return deleted ? json({ message: 'Advertisement deleted successfully' }) : json({ detail: 'Advertisement not found' }, { status: 404 });
}
