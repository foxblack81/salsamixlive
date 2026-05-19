import { getStats, json } from './_stats.js';

export async function onRequestGet({ env }) {
  return json(await getStats(env));
}
