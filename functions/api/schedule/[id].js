import { deleteItem, requireAdmin } from '../_admin.js';
import { json } from '../_json.js';

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const deleted = await deleteItem(auth.store, 'admin:schedule', params.id);
  return deleted ? json({ message: 'Schedule item deleted successfully' }) : json({ detail: 'Schedule item not found' }, { status: 404 });
}
