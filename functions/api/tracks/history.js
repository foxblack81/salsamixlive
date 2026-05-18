export async function onRequestGet() {
  return Response.json([], {
    headers: { 'Cache-Control': 'no-store' },
  });
}
