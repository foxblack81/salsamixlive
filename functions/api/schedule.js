import { json, unavailable } from './_json.js';

const DEFAULT_SCHEDULE = [
  {
    id: 'salsamix-24-7',
    dj_id: 'dj-kalenita',
    dj_name: 'DJ Kalenita',
    day_of_week: 0,
    start_time: '00:00',
    end_time: '23:59',
    show_name: 'SalsaMixLive 24/7',
    description: 'Salsa colombiana y clasicos latinos todo el dia.',
  },
  {
    id: 'ny-salsa-night',
    dj_id: 'dj-kalenita',
    dj_name: 'DJ Kalenita',
    day_of_week: 5,
    start_time: '19:00',
    end_time: '23:00',
    show_name: 'Viernes de Salsa desde NY',
    description: 'Mezcla salsera para empezar el fin de semana.',
  },
];

export async function onRequestGet() {
  return json(DEFAULT_SCHEDULE);
}

export async function onRequestPost() {
  return unavailable('Crear programacion');
}
