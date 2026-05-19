import { makeId, requireAdmin } from '../_admin.js';
import { json } from '../_json.js';

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const form = await request.formData();
  const file = form.get('file');

  if (!file || typeof file === 'string') {
    return json({ detail: 'Imagen requerida.' }, { status: 400 });
  }

  if (!String(file.type || '').startsWith('image/')) {
    return json({ detail: 'Solo se permiten imagenes.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return json({ detail: 'La imagen es muy grande. Maximo 5MB.' }, { status: 400 });
  }

  const id = makeId('upload');
  const buffer = await file.arrayBuffer();
  const data = {
    id,
    filename: file.name || `${id}.png`,
    content_type: file.type || 'image/png',
    data: arrayBufferToBase64(buffer),
    created_at: new Date().toISOString(),
  };

  await auth.store.put(`upload:${id}`, JSON.stringify(data));

  return json({
    filename: data.filename,
    url: `/api/uploads/${id}`,
    message: 'Imagen subida exitosamente',
  });
}
