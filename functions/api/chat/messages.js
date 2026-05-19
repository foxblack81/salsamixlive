import { json } from '../_json.js';

const KEY = 'chat:messages';

async function readMessages(env) {
  if (!env.SALSAMIX_STATS) return [];
  const stored = await env.SALSAMIX_STATS.get(KEY, 'json');
  return Array.isArray(stored) ? stored : [];
}

export async function onRequestGet({ env }) {
  const messages = await readMessages(env);
  return json({
    messages,
    online_count: messages.length ? Math.min(messages.length, 25) : 0,
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.SALSAMIX_STATS) {
    return json({ detail: 'Chat storage is not configured' }, { status: 503 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const username = String(body.username || '').trim().slice(0, 20);
  const message = String(body.message || '').trim().slice(0, 200);

  if (username.length < 2 || !message) {
    return json({ detail: 'Nombre y mensaje requeridos.' }, { status: 400 });
  }

  const messages = await readMessages(env);
  messages.push({
    id: crypto.randomUUID(),
    username,
    message,
    created_at: new Date().toISOString(),
  });

  const recent = messages.slice(-50);
  await env.SALSAMIX_STATS.put(KEY, JSON.stringify(recent));

  return json(recent[recent.length - 1]);
}
