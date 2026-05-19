import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import SocialMediaPopup from '../components/SocialMediaPopup';
import AdvertisementBanner from '../components/AdvertisementBanner';
import WeatherTicker from '../components/WeatherTicker';
import SocialShareButtons from '../components/SocialShareButtons';
import { Play, Calendar, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const summerEvents = [
  {
    badge: 'Gratis',
    date: 'MAY-SEP',
    title: 'Bryant Park Picnic Performances',
    location: 'Bryant Park - Midtown Manhattan',
    detail: 'Musica, danza, teatro, opera y jazz al aire libre. No requiere registro.',
    time: 'La mayoria 7:00 PM',
    accent: 'yellow'
  },
  {
    badge: 'Teatro',
    date: 'MAY-JUN',
    title: 'Free Shakespeare in the Park',
    location: 'Delacorte Theater - Central Park',
    detail: 'Romeo & Juliet gratis en Central Park con boletos por distribucion y loteria.',
    time: 'May 22 - Jun 28',
    accent: 'cyan'
  },
  {
    badge: 'Conciertos',
    date: 'VERANO',
    title: 'SummerStage Central Park',
    location: 'Rumsey Playfield - Central Park',
    detail: 'Conciertos y cultura gratis durante el verano en parques de NYC.',
    time: 'Fechas variables',
    accent: 'red'
  },
  {
    badge: 'Hudson',
    date: 'MAY-OCT',
    title: 'Summer on the Hudson',
    location: 'Riverside Park - West Side Manhattan',
    detail: 'Mas de 300 eventos gratis: conciertos, cine, baile, fitness y actividades familiares.',
    time: 'Todo el verano',
    accent: 'cyan'
  },
  {
    badge: 'Arte',
    date: 'JUL-SEP',
    title: 'River To River Festival',
    location: 'Lower Manhattan',
    detail: 'Festival gratis de arte, musica, performance e instalaciones en espacios publicos.',
    time: 'Julio a septiembre',
    accent: 'yellow'
  },
  {
    badge: 'Times Sq',
    date: 'MAY-SEP',
    title: 'TSQ LIVE',
    location: 'Times Square - Manhattan',
    detail: 'DJ sets, musica en vivo, baile y programas al aire libre en Times Square.',
    time: 'Viernes y fechas selectas',
    accent: 'red'
  },
  {
    badge: 'Especial',
    date: 'CALLE 8',
    title: 'Calle 8 en el Parque de Flushing',
    location: 'Flushing, Queens - Comunidad Latina',
    detail: 'Salsa, cultura latina, musica en vivo y ambiente familiar para la comunidad.',
    time: 'Fecha por anunciar',
    accent: 'yellow'
  }
];

const Home = () => {
  const [streamStatus, setStreamStatus] = useState(null);
  const [streamMetadata, setStreamMetadata] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [visitorStats, setVisitorStats] = useState({
    total_visits: 0,
    unique_visitors: 0,
    today_visits: 0,
    active_ads: 0,
    ad_impressions: 0
  });

  useEffect(() => {
    fetchData();
    trackVisitor();
    
    // Update document title with dynamic content for SEO
    document.title = 'SalsaMixLive.com | Radio de Salsa Colombiana En Vivo 24/7 - Escucha Gratis';
  }, []);

  const trackVisitor = async () => {
    try {
      // Obtener o crear un ID de visitante único
      let visitorId = localStorage.getItem('salsamix_visitor_id');
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('salsamix_visitor_id', visitorId);
      }
      
      const trackRes = await axios.post(`${API}/visitors/track`, { visitor_id: visitorId });
      
      // Obtener estadísticas actualizadas
      setVisitorStats(trackRes.data);
    } catch (error) {
      console.error('Error tracking visitor:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [statusRes, tracksRes, metadataRes] = await Promise.all([
        axios.get(`${API}/stream/status`),
        axios.get(`${API}/tracks/history?limit=5`),
        axios.get(`${API}/stream/metadata`)
      ]);
      setStreamStatus(statusRes.data);
      setRecentTracks(tracksRes.data);
      setStreamMetadata(metadataRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div data-testid="home-page" className="min-h-screen">
      <Navbar />
      
      {/* Weather Ticker - Carrusel de clima */}
      <WeatherTicker />
      
      {/* Social Media Popup */}
      <SocialMediaPopup />
      
      {/* Hero Section with semantic HTML */}
      <header
        data-testid="hero-section"
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/b1e467b6-82a0-4255-bcc5-9912ed46c9a3/images/5106021b85a2bf1f44e6c5811ded8ae89dfac8bfebed4a5279b8133dcf8b2320.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="banner"
        aria-label="SalsaMixLive - Radio de Salsa Colombiana"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {streamStatus?.is_live && (
            <div data-testid="live-badge" className="inline-flex items-center gap-2 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-full px-4 py-2 text-sm uppercase tracking-[0.2em] font-bold animate-pulse mb-6" role="status" aria-live="polite">
              <span className="w-3 h-3 bg-[#FF003C] rounded-full animate-pulse-glow" aria-hidden="true"></span>
              EN VIVO AHORA
            </div>
          )}
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Salsa</span>
            <span className="text-[#FFE600]">Mix</span>
            <span className="text-[#00E5FF]">Live</span>
            <span className="text-[#FF003C]">.com</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#A1A1AA] mb-8 max-w-2xl mx-auto">
            La mejor <strong>salsa colombiana</strong> 24/7. Transmision en vivo con los mejores DJs. 
            Escucha <strong>musica salsa gratis</strong> online desde Colombia.
          </p>
          
          <button
            data-testid="hero-play-button"
            onClick={() => window.open('/player', '_blank', 'width=800,height=600')}
            className="inline-flex items-center gap-3 bg-[#FFE600] text-black px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform btn-neon"
            aria-label="Escuchar salsa colombiana en vivo ahora"
          >
            <Play className="w-6 h-6" fill="currentColor" aria-hidden="true" />
            Escuchar Ahora
          </button>
          
          {/* Social Share Button */}
          <div className="mt-6 flex justify-center">
            <SocialShareButtons 
              url="https://salsamixlive.com"
              title="SalsaMixLive - La mejor salsa colombiana 24/7"
              description="Escucha la mejor salsa colombiana en vivo las 24 horas. ¡Música que alegra el alma!"
            />
          </div>

          {streamMetadata?.listeners > 0 && (
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/45">
              {streamMetadata.listeners.toLocaleString()} oyentes ahora
            </p>
          )}
        </div>
      </header>

      {/* Eventos Salseros - Main Content */}
      <main>
        <section className="container mx-auto px-4 py-12" aria-labelledby="eventos-heading">
          <article className="glass-effect rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#FFE600]" aria-hidden="true" />
                <h2 id="eventos-heading" className="text-2xl sm:text-3xl font-bold">Eventos gratis de verano en NY</h2>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Manhattan + comunidad latina</p>
            </div>
          
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" aria-label="Carrusel de eventos gratis de verano">
            {summerEvents.map((event) => {
              const accentClass = event.accent === 'cyan'
                ? 'border-[#00E5FF]/45 text-[#00E5FF] from-[#00E5FF]/15'
                : event.accent === 'red'
                  ? 'border-[#FF003C]/45 text-[#FF003C] from-[#FF003C]/15'
                  : 'border-[#FFE600]/45 text-[#FFE600] from-[#FFE600]/15';

              return (
                <article
                  key={event.title}
                  className={`min-w-[280px] sm:min-w-[340px] max-w-[360px] snap-start rounded-xl border bg-gradient-to-br ${accentClass} via-[#0F0F13] to-black/30 p-5 transition-transform hover:-translate-y-1`}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{event.badge}</p>
                      <p className="text-xl font-black text-white">{event.date}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${accentClass}`}>
                      Gratis
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{event.title}</h3>
                  <p className="text-[#00E5FF] text-sm mb-3">{event.location}</p>
                  <p className="text-[#A1A1AA] text-sm leading-relaxed min-h-[64px]">{event.detail}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/45">{event.time}</p>
                </article>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-[#A1A1AA]">
            Calendario curado de eventos gratis. Verifica horarios el mismo dia con cada organizador.
          </p>

        </article>
      </section>

      {/* Advertisement Banner - Negocios Locales */}
      <AdvertisementBanner />

      {/* About Section */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="about-heading">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <article>
            <h2 id="about-heading" className="text-3xl sm:text-4xl font-bold mb-4">
              Tu Emisora de <span className="text-[#FFE600]">Salsa</span> Favorita
            </h2>
            <p className="text-[#A1A1AA] text-lg leading-relaxed mb-6">
              <strong>SalsaMixLive.com</strong> es la plataforma lider de transmision de <strong>salsa colombiana</strong> en vivo en Colombia. 
              Con los mejores DJs y una seleccion incomparable de musica de <strong>Grupo Niche</strong>, <strong>Fruko y sus Tesos</strong>, 
              <strong>Joe Arroyo</strong> y mas artistas legendarios, te mantenemos bailando 24/7.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="glass-effect rounded-xl p-4 flex-1 min-w-[140px]">
                <p className="text-3xl font-black text-[#FFE600] mb-1">24/7</p>
                <p className="text-sm text-[#A1A1AA]">Transmisión en vivo</p>
              </div>
              <div className="glass-effect rounded-xl p-4 flex-1 min-w-[140px]">
                <p className="text-3xl font-black text-[#00E5FF] mb-1">10+</p>
                <p className="text-sm text-[#A1A1AA]">DJs profesionales</p>
              </div>
              <div className="glass-effect rounded-xl p-4 flex-1 min-w-[140px]">
                <p className="text-3xl font-black text-[#FF003C] mb-1">1000+</p>
                <p className="text-sm text-[#A1A1AA]">Oyentes diarios</p>
              </div>
            </div>
          </article>
          <figure className="relative">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/b1e467b6-82a0-4255-bcc5-9912ed46c9a3/images/d3360ac9b1c7583c5f43c19cd54252c8b277505c5fb92f4af8f1b7d4b19a9f59.png"
              alt="DJ mezclando musica salsa colombiana en vivo - SalsaMixLive radio online"
              className="rounded-2xl shadow-2xl w-full"
              loading="lazy"
              width="600"
              height="400"
            />
            <figcaption className="sr-only">Equipo de DJ profesional para mezclar salsa colombiana</figcaption>
          </figure>
        </div>
      </section>

      {/* Visitor Counter Section */}
      <section data-testid="visitor-counter-section" className="container mx-auto px-4 py-6" aria-labelledby="stats-heading">
        <article className="border-y border-white/10 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#00E5FF]" aria-hidden="true" />
              <h2 id="stats-heading" className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Actividad de la emisora</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[460px]">
              <div data-testid="total-visits" className="text-center">
                <p className="text-xl font-black text-[#FFE600]" aria-label={`${visitorStats.total_visits} visitas totales`}>
                  {visitorStats.total_visits.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#A1A1AA] uppercase tracking-[0.16em]">Total</p>
              </div>

              <div data-testid="ad-impressions" className="text-center">
                <p className="text-xl font-black text-[#00E5FF]" aria-label={`${visitorStats.ad_impressions} vistas de anuncios`}>
                  {visitorStats.ad_impressions.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#A1A1AA] uppercase tracking-[0.16em]">Anuncios</p>
              </div>

              <div data-testid="today-visits" className="text-center">
                <p className="text-xl font-black text-[#FF003C]" aria-label={`${visitorStats.today_visits} visitas hoy`}>
                  {visitorStats.today_visits.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#A1A1AA] uppercase tracking-[0.16em]">Hoy</p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-right text-[10px] uppercase tracking-[0.16em] text-white/35">
            {visitorStats.unique_visitors.toLocaleString()} visitantes unicos | {visitorStats.active_ads.toLocaleString()} anuncios activos
          </p>
        </article>
      </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
