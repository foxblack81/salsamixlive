import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DJs = () => {
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDJs();
  }, []);

  const fetchDJs = async () => {
    try {
      const response = await axios.get(`${API}/djs`);
      setDjs(response.data);
    } catch (error) {
      console.error('Error fetching DJs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="djs-page" className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-[#FFE600]" />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Nuestros DJs</h1>
        </div>
        
        <p className="text-lg text-[#A1A1AA] mb-12 max-w-3xl">
          Conoce a los talentosos DJs que hacen posible la mejor experiencia de salsa en vivo.
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : djs.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {djs.map((dj) => (
              <div
                key={dj.id}
                data-testid={`dj-card-${dj.id}`}
                className="bg-[#0F0F13] border border-white/10 rounded-2xl overflow-hidden hover:border-[#00E5FF]/50 transition-all duration-300 card-hover"
              >
                <div className="aspect-square bg-gradient-to-br from-[#FFE600]/20 via-[#00E5FF]/20 to-[#FF003C]/20 flex items-center justify-center">
                  {dj.avatar_url ? (
                    <img
                      src={dj.avatar_url}
                      alt={dj.full_name || dj.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-24 h-24 text-white/30" />
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {dj.full_name || dj.username}
                  </h3>
                  <p className="text-sm text-[#00E5FF] mb-3">@{dj.username}</p>
                  {dj.bio && (
                    <p className="text-sm text-[#A1A1AA] line-clamp-3">{dj.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-[#A1A1AA] mx-auto mb-4" />
            <p className="text-xl text-[#A1A1AA]">
              Aún no hay DJs registrados. ¡Vuelve pronto!
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DJs;