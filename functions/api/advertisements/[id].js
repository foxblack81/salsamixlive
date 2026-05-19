import { unavailable } from '../_json.js';

export async function onRequestPut() {
  return unavailable('Editar anuncios');
}

export async function onRequestDelete() {
  return unavailable('Eliminar anuncios');
}
