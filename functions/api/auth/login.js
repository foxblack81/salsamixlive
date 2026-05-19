import { json } from '../_json.js';

export async function onRequestPost() {
  return json(
    {
      detail: 'El panel admin todavia no esta conectado a una base de datos segura en Cloudflare Pages.',
    },
    { status: 401 },
  );
}
