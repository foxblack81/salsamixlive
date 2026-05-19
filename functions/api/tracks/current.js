import { fetchIcecastMetadata, normalizeMetadata } from '../stream/_utils.js';
import { makeId, readCollection, requireAdmin, writeJson } from '../_admin.js';

export async function onRequestGet({ env }) {
  const saved = env.SALSAMIX_STATS ? await readCollection(env.SALSAMIX_STATS, 'admin:tracks') : [];
  if (saved[0]) {
    return Response.json(saved[0], { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const metadata = normalizeMetadata(await fetchIcecastMetadata());
    return Response.json({
      id: 'icecast-current',
      title: metadata.song || metadata.title,
      artist: metadata.artist,
      album: '',
      duration: 0,
      played_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({});
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const track = {
    id: makeId('track'),
    title: String(body.title || '').trim(),
    artist: String(body.artist || '').trim(),
    album: String(body.album || ''),
    duration: Number(body.duration || 0),
    played_at: new Date().toISOString(),
  };

  if (!track.title || !track.artist) {
    return Response.json({ detail: 'Titulo y artista son requeridos.' }, { status: 400 });
  }

  const tracks = await readCollection(auth.store, 'admin:tracks');
  tracks.unshift(track);
  await writeJson(auth.store, 'admin:tracks', tracks.slice(0, 50));
  return Response.json(track, { headers: { 'Cache-Control': 'no-store' } });
}
