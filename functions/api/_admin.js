import { json } from './_json.js';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getStore(env) {
  return env.SALSAMIX_STATS;
}

export function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function readJson(store, key, fallback) {
  const value = await store.get(key, 'json');
  return value ?? fallback;
}

export async function writeJson(store, key, value) {
  await store.put(key, JSON.stringify(value));
  return value;
}

export async function requireAdmin(request, env) {
  const store = getStore(env);
  if (!store) {
    return { error: json({ detail: 'Admin storage is not configured.' }, { status: 503 }) };
  }

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return { error: json({ detail: 'No autorizado.' }, { status: 401 }) };
  }

  const session = await store.get(`session:${token}`, 'json');
  if (!session || session.role !== 'admin') {
    return { error: json({ detail: 'Sesion invalida o expirada.' }, { status: 401 }) };
  }

  return { store, user: session, token };
}

export async function createAdminSession(store) {
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const user = {
    id: 'admin',
    username: 'admin',
    email: 'admin@salsamixlive.com',
    role: 'admin',
    full_name: 'SalsaMixLive Admin',
  };

  await store.put(`session:${token}`, JSON.stringify(user), { expirationTtl: SESSION_TTL_SECONDS });
  return { token, user };
}

export async function getAdminPassword(store) {
  return (await store.get('admin:password')) || 'SalsaMixLive2026!';
}

export async function readCollection(store, key, fallback = []) {
  const items = await readJson(store, key, fallback);
  return Array.isArray(items) ? items : fallback;
}

export async function upsertItem(store, key, item) {
  const items = await readCollection(store, key);
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    items[index] = { ...items[index], ...item };
  } else {
    items.push(item);
  }
  await writeJson(store, key, items);
  return item;
}

export async function deleteItem(store, key, id) {
  const items = await readCollection(store, key);
  const nextItems = items.filter((entry) => entry.id !== id);
  await writeJson(store, key, nextItems);
  return items.length !== nextItems.length;
}
