function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function onRequestGet({ env, params }) {
  const stored = env.SALSAMIX_STATS ? await env.SALSAMIX_STATS.get(`upload:${params.id}`, 'json') : null;
  if (!stored) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(base64ToArrayBuffer(stored.data), {
    headers: {
      'Content-Type': stored.content_type || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
