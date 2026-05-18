import { fetchIcecastMetadata, normalizeMetadata } from './_utils.js';

export async function onRequestGet() {
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
