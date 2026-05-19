import { makeId, readCollection, requireAdmin, writeJson } from '../_admin.js';
import { json } from '../_json.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim();

  if (!username || !email) {
    return json({ detail: 'Usuario y email son requeridos.' }, { status: 400 });
  }

  const djs = await readCollection(auth.store, 'admin:djs');
  if (djs.some((dj) => dj.username.toLowerCase() === username.toLowerCase())) {
    return json({ detail: 'Ese usuario ya existe.' }, { status: 400 });
  }

  const dj = {
    id: makeId('dj'),
    username,
    email,
    role: 'dj',
    full_name: String(body.full_name || username).trim(),
    bio: '',
    avatar_url: '',
    created_at: new Date().toISOString(),
  };

  djs.push(dj);
  await writeJson(auth.store, 'admin:djs', djs);
  return json(dj);
}
