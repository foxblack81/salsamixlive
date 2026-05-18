import { fetchIcecastMetadata, normalizeMetadata } from './_utils.js';

export async function onRequestGet() {
  try {
    const source = await fetchIcecastMetadata();
    return Response.json(normalizeMetadata(source), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      {
        title: '',
        artist: '',
        song: '',
        listeners: 0,
        server_name: 'SalsaMixLive',
        bitrate: 128,
        is_live: false,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
