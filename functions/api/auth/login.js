import { createAdminSession, getAdminPassword, getStore } from '../_admin.js';
import { json } from '../_json.js';

export async function onRequestPost({ request, env }) {
  const store = getStore(env);
  if (!store) {
    return json({ detail: 'Admin storage is not configured.' }, { status: 503 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const adminPassword = await getAdminPassword(store);

  if (username !== 'admin' || password !== adminPassword) {
    return json({ detail: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }

  const session = await createAdminSession(store);

  return json({
    access_token: session.token,
    token_type: 'bearer',
    user: session.user,
  });
}
