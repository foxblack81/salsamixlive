import { fetchIcecastMetadata, normalizeMetadata } from './_utils.js';
import { readJson, requireAdmin, writeJson } from '../_admin.js';

export async function onRequestGet({ env }) {
  const manual = env.SALSAMIX_STATS ? await readJson(env.SALSAMIX_STATS, 'admin:stream_status', null) : null;
  if (manual) {
    return Response.json(manual, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const metadata = normalizeMetadata(await fetchIcecastMetadata());
    return Response.json(
      {
        is_live: metadata.is_live,
        current_dj: metadata.server_name,
        listeners: metadata.listeners,
        stream_url: '/api/stream/proxy',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        is_live: false,
        current_dj: '',
        listeners: 0,
        stream_url: '/api/stream/proxy',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const status = {
    is_live: body.is_live === true,
    current_dj: String(body.current_dj || ''),
    listeners: Number(body.listeners || 0),
    stream_url: String(body.stream_url || '/api/stream/proxy'),
    updated_at: new Date().toISOString(),
  };

  await writeJson(auth.store, 'admin:stream_status', status);
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
