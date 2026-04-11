import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvertisementBanner = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000); // Cambiar cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API}/advertisements?active_only=true`);
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    }
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <section className="container mx-auto px-4 py-8" aria-label="Patrocinadores">
      <div className="glass-effect rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            <span className="text-[#FFE600]">Negocios</span> Locales
          </h2>
          {ads.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-[#A1A1AA]">
                {currentIndex + 1} / {ads.length}
              </span>
              <button
                onClick={goToNext}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="relative overflow-hidden rounded-xl">
          <a
            href={currentAd.link_url || '#'}
            target={currentAd.link_url ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-xl">
              <img
                src={currentAd.image_url}
                alt={currentAd.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay con info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {currentAd.title}
                      </h3>
                      {currentAd.description && (
                        <p className="text-[#A1A1AA] text-sm md:text-base line-clamp-2">
                          {currentAd.description}
                        </p>
                      )}
                    </div>
                    {currentAd.link_url && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#FFE600] text-black rounded-lg font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Visitar</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </a>

          {/* Indicadores de posición */}
          {ads.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-8 bg-[#FFE600]'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Ir a anuncio ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#A1A1AA] mt-4">
          Publicidad • Apoya a los negocios locales
        </p>
      </div>
    </section>
  );
};

export default AdvertisementBanner;
