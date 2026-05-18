import { STREAM_URL } from './_utils.js';

export async function onRequestGet() {
  const upstream = await fetch(STREAM_URL, {
    headers: {
      'User-Agent': 'SalsaMixLive/1.0',
      Accept: '*/*',
      'Icy-MetaData': '0',
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Stream unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
