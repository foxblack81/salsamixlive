const STREAM_URL = 'http://cast1.asurahosting.com:7527/autodj';
const METADATA_URL = 'http://cast1.asurahosting.com:7527/status-json.xsl';

export async function fetchIcecastMetadata() {
  const response = await fetch(METADATA_URL, {
    headers: {
      'User-Agent': 'SalsaMixLive/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Metadata request failed with ${response.status}`);
  }

  const data = await response.json();
  const source = Array.isArray(data?.icestats?.source)
    ? data.icestats.source[0]
    : data?.icestats?.source;

  return source || {};
}

export function normalizeMetadata(source = {}) {
  const title = source.title || '';
  const [artist = '', song = ''] = title.includes(' - ')
    ? title.split(' - ', 2).map((part) => part.trim())
    : ['', title];

  return {
    title,
    artist,
    song,
    listeners: Number(source.listeners || 0),
    server_name: source.server_name || 'SalsaMixLive',
    bitrate: Number(source.bitrate || 128),
    is_live: Boolean(source.listenurl || title || source.listeners),
  };
}

export { METADATA_URL, STREAM_URL };
