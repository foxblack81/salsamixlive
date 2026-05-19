import { readJson, requireAdmin, writeJson } from './_admin.js';
import { json } from './_json.js';

const SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  twitter: '',
};

export async function onRequestGet({ env }) {
  const links = env.SALSAMIX_STATS ? await readJson(env.SALSAMIX_STATS, 'admin:social_links', SOCIAL_LINKS) : SOCIAL_LINKS;
  return json({ ...SOCIAL_LINKS, ...links });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const links = {};
  for (const key of Object.keys(SOCIAL_LINKS)) {
    links[key] = String(body[key] || '').trim();
  }

  await writeJson(auth.store, 'admin:social_links', links);
  return json({ message: 'Social links updated successfully', ...links });
}
