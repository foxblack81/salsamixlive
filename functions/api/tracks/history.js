export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50);
  const tracks = env.SALSAMIX_STATS ? (await env.SALSAMIX_STATS.get('admin:tracks', 'json')) || [] : [];
  return Response.json(tracks.slice(0, limit), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
