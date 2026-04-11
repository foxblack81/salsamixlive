import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';

const Player = () => {
  const navigate = useNavigate();
  const STREAM_URL = process.env.REACT_APP_STREAM_URL || "http://65.108.105.26:7527/autodj";

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              <span className="text-white">Salsa</span>
              <span className="text-[#FFE600]">Mix</span>
              <span className="text-[#00E5FF]">Live</span>
              <span className="text-[#FF003C]">.com</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-full px-3 py-1 text-xs uppercase tracking-wider font-bold animate-pulse">
                <span className="w-2 h-2 bg-[#FF003C] rounded-full animate-pulse-glow"></span>
                EN VIVO
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-white hover:text-[#FF003C] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player Card */}
        <div className="glass-effect rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <Volume2 className="w-16 h-16 text-[#FFE600] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Reproductor de Audio</h2>
            <p className="text-[#A1A1AA]">Transmisión en vivo desde Asura Hosting</p>
          </div>

          {/* HTML5 Audio Player Nativo */}
          <div className="bg-[#0F0F13] rounded-xl p-6 mb-6">
            <audio
              controls
              autoPlay
              src={STREAM_URL}
              className="w-full"
              style={{
                width: '100%',
                height: '54px',
                filter: 'invert(1) hue-rotate(180deg)',
              }}
            >
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>

          {/* Instrucciones */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-[#0F0F13] rounded-xl">
              <span className="text-[#FFE600] font-bold">1.</span>
              <p className="text-[#A1A1AA]">
                <strong className="text-white">Haz click en el botón de PLAY</strong> del reproductor arriba
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#0F0F13] rounded-xl">
              <span className="text-[#00E5FF] font-bold">2.</span>
              <p className="text-[#A1A1AA]">
                Si no suena, <strong className="text-white">ajusta el volumen</strong> del reproductor
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#0F0F13] rounded-xl">
              <span className="text-[#FF003C] font-bold">3.</span>
              <p className="text-[#A1A1AA]">
                Si el navegador bloquea, <strong className="text-white">permite el audio</strong> cuando lo solicite
              </p>
            </div>
          </div>

          {/* Link alternativo */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-[#A1A1AA] text-center mb-3">
              ¿Problemas para reproducir?
            </p>
            <a
              href={STREAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
            >
              Abrir en VLC / Reproductor Externo
            </a>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#A1A1AA]">
            Stream: <span className="text-[#00E5FF] font-mono text-xs">cast1.asurahosting.com:7527</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Player;
