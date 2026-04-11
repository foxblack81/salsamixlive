import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// SVG Icons for social media
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SocialMediaPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: ''
  });

  useEffect(() => {
    fetchSocialLinks();
    // Mostrar popup después de 5 segundos
    const timer = setTimeout(() => {
      const hasSeenPopup = sessionStorage.getItem('social_popup_seen');
      if (!hasSeenPopup) {
        setIsOpen(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await axios.get(`${API}/social-links`);
      setSocialLinks(response.data);
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('social_popup_seen', 'true');
  };

  const socialNetworks = [
    { key: 'facebook', icon: FacebookIcon, color: '#1877F2', name: 'Facebook' },
    { key: 'instagram', icon: InstagramIcon, color: '#E4405F', name: 'Instagram' },
    { key: 'tiktok', icon: TiktokIcon, color: '#000000', name: 'TikTok' },
    { key: 'youtube', icon: YoutubeIcon, color: '#FF0000', name: 'YouTube' }
  ];

  // Filtrar solo las redes que tienen URL configurada
  const activeSocials = socialNetworks.filter(s => socialLinks[s.key]);

  if (!isOpen || activeSocials.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-[#0A0A0F] border border-white/20 rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black mb-2">
            <span className="text-[#FFE600]">Siguenos</span> en Redes
          </h3>
          <p className="text-[#A1A1AA]">No te pierdas las novedades de SalsaMixLive</p>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-4 mb-6">
          {activeSocials.map(({ key, icon: Icon, color, name }) => (
            <a
              key={key}
              href={socialLinks[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-110"
              style={{ '--social-color': color }}
              title={name}
            >
              <div className="text-white group-hover:text-[var(--social-color)] transition-colors">
                <Icon />
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {name}
              </span>
            </a>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleClose}
          className="w-full mt-4 py-3 bg-gradient-to-r from-[#FFE600] to-[#00E5FF] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
        >
          Seguir Escuchando
        </button>
      </div>
    </div>
  );
};

export default SocialMediaPopup;
