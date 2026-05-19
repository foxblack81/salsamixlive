import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const NETWORKS = [
  { key: 'facebook', name: 'Facebook', label: 'f', color: 'hover:text-[#1877F2]' },
  { key: 'instagram', name: 'Instagram', label: 'IG', color: 'hover:text-[#E4405F]' },
  { key: 'tiktok', name: 'TikTok', label: 'TT', color: 'hover:text-white' },
  { key: 'youtube', name: 'YouTube', label: 'YT', color: 'hover:text-[#FF0000]' },
  { key: 'twitter', name: 'X', label: 'X', color: 'hover:text-[#00E5FF]' },
];

const SocialLinksBar = ({ compact = false, className = '' }) => {
  const [links, setLinks] = useState({});

  useEffect(() => {
    axios.get(`${API}/social-links`)
      .then((response) => setLinks(response.data || {}))
      .catch((error) => {
        console.error('Error fetching social links:', error);
        setLinks({});
      });
  }, []);

  const activeLinks = NETWORKS.filter((network) => links[network.key]);

  if (activeLinks.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`} data-testid="social-links-bar">
      {activeLinks.map(({ key, name, label, color }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${name} de SalsaMixLive`}
          title={name}
          className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/75 transition-all hover:-translate-y-0.5 hover:border-white/35 ${color} ${
            compact ? 'h-10 w-10' : 'h-12 w-12'
          }`}
        >
          <span className="font-black leading-none" aria-hidden="true">{label}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialLinksBar;
