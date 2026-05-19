import { makeId, readCollection, requireAdmin, writeJson } from './_admin.js';
import { json } from './_json.js';

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
    return json({ detail: 'Titulo y artista son requeridos.' }, { status: 400 });
  }

  const tracks = await readCollection(auth.store, 'admin:tracks');
  tracks.unshift(track);
  await writeJson(auth.store, 'admin:tracks', tracks.slice(0, 50));
  return json(track);
}
