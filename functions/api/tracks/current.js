import { fetchIcecastMetadata, normalizeMetadata } from '../stream/_utils.js';

export async function onRequestGet() {
  try {
    const metadata = normalizeMetadata(await fetchIcecastMetadata());
    return Response.json({
      title: metadata.song || metadata.title,
      artist: metadata.artist,
    });
  } catch (error) {
    return Response.json({});
  }
}
