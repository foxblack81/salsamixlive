import { json } from '../_json.js';

export async function onRequestGet() {
  return json({
    is_live: false,
    dj_name: null,
    listener_count: 0,
    stream_start_time: null,
  });
}
