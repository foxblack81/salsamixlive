export function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

export function unavailable(feature = 'Servicio') {
  return json(
    {
      detail: `${feature} no esta conectado al panel todavia.`,
    },
    { status: 503 },
  );
}
