import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import SocialMediaPopup from '../components/SocialMediaPopup';
import AdvertisementBanner from '../components/AdvertisementBanner';
import WeatherTicker from '../components/WeatherTicker';
import SocialShareButtons from '../components/SocialShareButtons';
import { Play, Radio as RadioIcon, Calendar, Users, Eye } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [streamStatus, setStreamStatus] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [visitorStats, setVisitorStats] = useState({ total_visits: 0, unique_visitors: 0, today_visits: 0 });

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
      
      await axios.post(`${API}/visitors/track`, { visitor_id: visitorId });
      
      // Obtener estadísticas actualizadas
      const statsRes = await axios.get(`${API}/visitors/stats`);
      setVisitorStats(statsRes.data);
    } catch (error) {
      console.error('Error tracking visitor:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [statusRes, tracksRes] = await Promise.all([
        axios.get(`${API}/stream/status`),
        axios.get(`${API}/tracks/history?limit=5`)
      ]);
      setStreamStatus(statusRes.data);
      setRecentTracks(tracksRes.data);
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
        </div>
      </header>

      {/* Eventos Salseros - Main Content */}
      <main>
        <section className="container mx-auto px-4 py-12" aria-labelledby="eventos-heading">
          <article className="glass-effect rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[#FFE600]" aria-hidden="true" />
              <h2 id="eventos-heading" className="text-2xl sm:text-3xl font-bold">Eventos Salseros en tu Area</h2>
            </div>
          
          <div className="space-y-4">
            {/* Evento 1 */}
            <div className="flex flex-col sm:flex-row gap-4 p-5 bg-[#0F0F13] rounded-xl border border-white/10 hover:border-[#FFE600]/50 transition-colors">
              <div className="flex-shrink-0 bg-gradient-to-br from-[#FFE600]/20 to-[#FF003C]/20 rounded-lg p-4 text-center sm:w-24">
                <div className="text-3xl font-black text-[#FFE600]">15</div>
                <div className="text-sm text-[#A1A1AA] uppercase">ABR</div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Noche de Salsa en Vivo</h3>
                <p className="text-[#00E5FF] text-sm mb-2">📍 Club La Rumba - Cali</p>
                <p className="text-[#A1A1AA] text-sm">🎵 Con DJ Carlos & Orquesta Sabor Latino</p>
                <p className="text-[#A1A1AA] text-sm mt-2">⏰ 9:00 PM - 3:00 AM</p>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end">
                <span className="px-4 py-2 bg-[#FFE600]/20 text-[#FFE600] rounded-lg text-sm font-bold whitespace-nowrap">
                  $25.000
                </span>
              </div>
            </div>

            {/* Evento 2 */}
            <div className="flex flex-col sm:flex-row gap-4 p-5 bg-[#0F0F13] rounded-xl border border-white/10 hover:border-[#FFE600]/50 transition-colors">
              <div className="flex-shrink-0 bg-gradient-to-br from-[#00E5FF]/20 to-[#FFE600]/20 rounded-lg p-4 text-center sm:w-24">
                <div className="text-3xl font-black text-[#00E5FF]">22</div>
                <div className="text-sm text-[#A1A1AA] uppercase">ABR</div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Festival de Salsa Colombiana</h3>
                <p className="text-[#00E5FF] text-sm mb-2">📍 Plaza Mayor - Medellín</p>
                <p className="text-[#A1A1AA] text-sm">🎵 Grupo Niche, Fruko y sus Tesos</p>
                <p className="text-[#A1A1AA] text-sm mt-2">⏰ 6:00 PM - 12:00 AM</p>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end">
                <span className="px-4 py-2 bg-[#00E5FF]/20 text-[#00E5FF] rounded-lg text-sm font-bold whitespace-nowrap">
                  $50.000
                </span>
              </div>
            </div>

            {/* Evento 3 */}
            <div className="flex flex-col sm:flex-row gap-4 p-5 bg-[#0F0F13] rounded-xl border border-white/10 hover:border-[#FFE600]/50 transition-colors">
              <div className="flex-shrink-0 bg-gradient-to-br from-[#FF003C]/20 to-[#00E5FF]/20 rounded-lg p-4 text-center sm:w-24">
                <div className="text-3xl font-black text-[#FF003C]">30</div>
                <div className="text-sm text-[#A1A1AA] uppercase">ABR</div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Clases de Salsa Gratis</h3>
                <p className="text-[#00E5FF] text-sm mb-2">📍 Academia Sabor - Bogotá</p>
                <p className="text-[#A1A1AA] text-sm">🎵 Iniciantes y Avanzados</p>
                <p className="text-[#A1A1AA] text-sm mt-2">⏰ 7:00 PM - 9:00 PM</p>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end">
                <span className="px-4 py-2 bg-[#FF003C]/20 text-[#FF003C] rounded-lg text-sm font-bold whitespace-nowrap">
                  GRATIS
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button className="px-6 py-3 bg-gradient-to-r from-[#FFE600] to-[#00E5FF] text-black font-bold rounded-xl hover:scale-105 transition-transform" aria-label="Ver todos los eventos de salsa">
              Ver Todos los Eventos
            </button>
          </div>
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
      <section data-testid="visitor-counter-section" className="container mx-auto px-4 py-8" aria-labelledby="stats-heading">
        <article className="glass-effect rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#00E5FF]" aria-hidden="true" />
            <h2 id="stats-heading" className="text-2xl sm:text-3xl font-bold">Estadisticas de Visitas</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div data-testid="total-visits" className="bg-gradient-to-br from-[#FFE600]/10 to-[#FFE600]/5 rounded-xl p-6 text-center border border-[#FFE600]/20">
              <Eye className="w-8 h-8 text-[#FFE600] mx-auto mb-3" aria-hidden="true" />
              <p className="text-4xl font-black text-[#FFE600] mb-2" aria-label={`${visitorStats.total_visits} visitas totales`}>
                {visitorStats.total_visits.toLocaleString()}
              </p>
              <p className="text-sm text-[#A1A1AA] uppercase tracking-wider">Visitas Totales</p>
            </div>
            
            <div data-testid="unique-visitors" className="bg-gradient-to-br from-[#00E5FF]/10 to-[#00E5FF]/5 rounded-xl p-6 text-center border border-[#00E5FF]/20">
              <Users className="w-8 h-8 text-[#00E5FF] mx-auto mb-3" aria-hidden="true" />
              <p className="text-4xl font-black text-[#00E5FF] mb-2" aria-label={`${visitorStats.unique_visitors} visitantes unicos`}>
                {visitorStats.unique_visitors.toLocaleString()}
              </p>
              <p className="text-sm text-[#A1A1AA] uppercase tracking-wider">Visitantes Unicos</p>
            </div>
            
            <div data-testid="today-visits" className="bg-gradient-to-br from-[#FF003C]/10 to-[#FF003C]/5 rounded-xl p-6 text-center border border-[#FF003C]/20">
              <Eye className="w-8 h-8 text-[#FF003C] mx-auto mb-3" aria-hidden="true" />
              <p className="text-4xl font-black text-[#FF003C] mb-2" aria-label={`${visitorStats.today_visits} visitas hoy`}>
                {visitorStats.today_visits.toLocaleString()}
              </p>
              <p className="text-sm text-[#A1A1AA] uppercase tracking-wider">Visitas Hoy</p>
            </div>
          </div>
        </article>
      </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;