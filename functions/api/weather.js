import { json } from './_json.js';

const FALLBACK_WEATHER = [
  {
    city: 'New York',
    country: 'USA',
    temp_c: 20,
    temp_f: 68,
    condition: 'Verano salsero',
    icon: '☀️',
    humidity: 55,
    wind_kph: 8,
  },
  {
    city: 'Cali',
    country: 'Colombia',
    temp_c: 27,
    temp_f: 81,
    condition: 'Salsa caliente',
    icon: '🎶',
    humidity: 62,
    wind_kph: 6,
  },
];

export async function onRequestGet() {
  return json(FALLBACK_WEATHER);
}
