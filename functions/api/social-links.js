import { json } from './_json.js';

const SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  twitter: '',
};

export async function onRequestGet() {
  return json(SOCIAL_LINKS);
}

export async function onRequestPut() {
  return json({ message: 'Social links saved locally are not enabled on this Pages deploy yet.' }, { status: 503 });
}
