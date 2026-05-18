import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Marquee from 'react-fast-marquee';
import axios from 'axios';
import AudioVisualizer from './AudioVisualizer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Usar proxy HTTPS para evitar mixed content blocking
const STREAM_URL = `${BACKEND_URL}/api/stream/proxy`;

const GlobalAudioPlayer = () => {
  const audioRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const watchdogIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastProgressTimeRef = useRef(Date.now());
  const lastCurrentTimeRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyPausedRef = useRef(false);
  const audioContextRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [streamMetadata, setStreamMetadata] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [audioElement, setAudioElement] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const MAX_RECONNECT_ATTEMPTS = 20;
  const WATCHDOG_INTERVAL = 3000;
  const STALL_THRESHOLD = 15000; // 15 segundos antes de considerar stall
  const HEARTBEAT_INTERVAL = 2000; // Check cada 2 segundos

  // Create fresh audio element with cache-busting
  const createAudioElement = useCallback(() => {
    // Destroy old audio completely
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current.remove?.();
      } catch (e) {
        console.warn('Error cleaning up audio:', e);
      }
    }

    const audio = new Audio();
    
    // Critical settings for mobile
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';
    audio.volume = isMuted ? 0 : volume / 100;
    
    // Use proxy URL with cache-busting
    const timestamp = Date.now();
    audio.src = `${STREAM_URL}?t=${timestamp}`;
    
    audioRef.current = audio;
    lastCurrentTimeRef.current = 0;
    setAudioElement(audio);
    
    return audio;
  }, [volume, isMuted]);

  // Force reconnect - completely destroys and recreates audio
  const forceReconnect = useCallback(() => {
    if (isManuallyPausedRef.current) return;
    
    console.log('🔄 Force reconnecting...');
    setIsReconnecting(true);
    setConnectionStatus('connecting');
    
    // Clear ALL timers
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    
    // Small delay before reconnecting
    reconnectTimeoutRef.current = setTimeout(() => {
      const audio = createAudioElement();
      
      audio.play()
        .then(() => {
          console.log('✅ Reconnected successfully');
          reconnectAttemptsRef.current = 0;
          setIsReconnecting(false);
          setIsPlaying(true);
          setConnectionStatus('connected');
          lastProgressTimeRef.current = Date.now();
          lastCurrentTimeRef.current = audio.currentTime || 0;
          startHeartbeat();
        })
        .catch((err) => {
          console.error('❌ Reconnect failed:', err);
          reconnectAttemptsRef.current += 1;
          
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(2000 * reconnectAttemptsRef.current, 15000);
            console.log(`⏳ Retrying in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            reconnectTimeoutRef.current = setTimeout(forceReconnect, delay);
          } else {
            setConnectionStatus('error');
            setIsReconnecting(false);
          }
        });
    }, 500);
  }, [createAudioElement]);

  // Heartbeat - checks audio progress every second
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || isManuallyPausedRef.current || showWelcome) return;
      
      const now = Date.now();
      
      // Only count real playback progress. A frozen stream can keep currentTime > 0 forever.
      const currentTime = audio.currentTime || 0;
      const hasAdvanced = currentTime > lastCurrentTimeRef.current + 0.05;

      if (!audio.paused && hasAdvanced) {
        lastProgressTimeRef.current = now;
        lastCurrentTimeRef.current = currentTime;
        setIsBuffering(false);
      }
      
      // Check for stall - be more patient
      const timeSinceProgress = now - lastProgressTimeRef.current;
      
      if (timeSinceProgress > STALL_THRESHOLD && !audio.paused) {
        console.log('⚠️ Audio stalled for ' + (timeSinceProgress/1000) + 's, forcing reconnect...');
        forceReconnect();
      } else if (timeSinceProgress > 5000 && !audio.paused) {
        setIsBuffering(true);
      }
    }, HEARTBEAT_INTERVAL);
  }, [forceReconnect, showWelcome]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = createAudioElement();

    const handlePlay = () => {
      console.log('▶️ Audio playing');
      setIsPlaying(true);
      setIsBuffering(false);
      setConnectionStatus('connected');
      lastProgressTimeRef.current = Date.now();
      lastCurrentTimeRef.current = audio.currentTime || 0;
      isManuallyPausedRef.current = false;
    };

    const handlePause = () => {
      console.log('⏸️ Audio paused');
      if (!isManuallyPausedRef.current) {
        // Unexpected pause - try to resume
        setTimeout(() => {
          if (!isManuallyPausedRef.current && audioRef.current) {
            audioRef.current.play().catch(() => forceReconnect());
          }
        }, 1000);
      }
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      if (!isManuallyPausedRef.current && !showWelcome) {
        setConnectionStatus('error');
        forceReconnect();
      }
    };

    const handleStalled = () => {
      console.log('⚠️ Audio stalled event');
      setIsBuffering(true);
    };

    const handleWaiting = () => {
      console.log('⏳ Audio buffering...');
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      console.log('🎵 Audio resumed playing');
      setIsBuffering(false);
      setConnectionStatus('connected');
      lastProgressTimeRef.current = Date.now();
      lastCurrentTimeRef.current = audio.currentTime || 0;
    };

    const handleTimeUpdate = () => {
      lastProgressTimeRef.current = Date.now();
      lastCurrentTimeRef.current = audio.currentTime || lastCurrentTimeRef.current;
      setIsBuffering(false);
    };

    const handleEnded = () => {
      console.log('🔚 Audio ended (stream stopped?)');
      if (!isManuallyPausedRef.current && !showWelcome) {
        forceReconnect();
      }
    };

    const handleCanPlay = () => {
      console.log('✅ Audio can play');
      setIsBuffering(false);
      setConnectionStatus('connected');
    };

    // Attach listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden');
      } else {
        console.log('👁️ Tab visible');
        // Check if audio stopped while hidden
        if (isPlaying && audioRef.current) {
          if (audioRef.current.paused && !isManuallyPausedRef.current) {
            console.log('🔄 Resuming after tab switch...');
            audioRef.current.play().catch(() => forceReconnect());
          }
          // Check for silent stall
          const timeSinceProgress = Date.now() - lastProgressTimeRef.current;
          if (timeSinceProgress > STALL_THRESHOLD) {
            console.log('🔄 Reconnecting after long pause...');
            forceReconnect();
          }
        }
      }
    };

    // Handle online/offline
    const handleOnline = () => {
      console.log('🌐 Back online');
      if (!isManuallyPausedRef.current && !showWelcome) {
        forceReconnect();
      }
    };

    const handleOffline = () => {
      console.log('📴 Went offline');
      setConnectionStatus('error');
    };

    // Mobile: handle audio interruptions (calls, etc)
    const handleAudioInterrupt = () => {
      console.log('📱 Audio interrupted');
      if (!isManuallyPausedRef.current) {
        setTimeout(() => {
          if (!isManuallyPausedRef.current && audioRef.current?.paused) {
            forceReconnect();
          }
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // iOS specific
    document.addEventListener('pause', handleAudioInterrupt);
    document.addEventListener('resume', () => {
      if (!isManuallyPausedRef.current) forceReconnect();
    });

    // Fetch metadata
    fetchStreamStatus();
    fetchCurrentTrack();
    fetchStreamMetadata();
    const metadataInterval = setInterval(() => {
      fetchStreamStatus();
      fetchCurrentTrack();
      fetchStreamMetadata();
    }, 5000);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      clearInterval(metadataInterval);
      clearInterval(watchdogIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Media Session API for lock screen controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: streamMetadata?.title || 'SalsaMixLive',
        artist: streamMetadata?.artist || 'Salsa Colombiana 24/7',
        album: 'En Vivo',
        artwork: [
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current && !showWelcome) {
          isManuallyPausedRef.current = false;
          reconnectAttemptsRef.current = 0;
          audioRef.current.play().catch(() => forceReconnect());
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          isManuallyPausedRef.current = true;
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (audioRef.current) {
          isManuallyPausedRef.current = true;
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, showWelcome, streamMetadata, forceReconnect]);

  const fetchStreamStatus = async () => {
    try {
      const response = await axios.get(`${API}/stream/status`);
      setStreamStatus(response.data);
    } catch (error) {
      console.error('Error fetching stream status:', error);
    }
  };

  const fetchCurrentTrack = async () => {
    try {
      const response = await axios.get(`${API}/tracks/current`);
      setCurrentTrack(response.data);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchStreamMetadata = async () => {
    try {
      const response = await axios.get(`${API}/stream/metadata`);
      if (response.data && response.data.title) {
        setStreamMetadata(response.data);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const startPlaying = () => {
    setShowWelcome(false);
    isManuallyPausedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setConnectionStatus('connecting');
    
    const audio = createAudioElement();
    
    audio.play()
      .then(() => {
        console.log('✅ Playback started');
        setIsPlaying(true);
        setConnectionStatus('connected');
        lastProgressTimeRef.current = Date.now();
        lastCurrentTimeRef.current = audio.currentTime || 0;
        startHeartbeat();
      })
      .catch((err) => {
        console.error('❌ Failed to start playback:', err);
        setConnectionStatus('error');
        forceReconnect();
      });
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      isManuallyPausedRef.current = true;
      audioRef.current.pause();
      setIsPlaying(false);
      clearInterval(heartbeatIntervalRef.current);
    } else {
      isManuallyPausedRef.current = false;
      reconnectAttemptsRef.current = 0;
      
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setConnectionStatus('connected');
          lastProgressTimeRef.current = Date.now();
          lastCurrentTimeRef.current = audioRef.current?.currentTime || 0;
          startHeartbeat();
        })
        .catch(() => {
          forceReconnect();
        });
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume / 100;
    }
  };

  const manualReconnect = () => {
    reconnectAttemptsRef.current = 0;
    isManuallyPausedRef.current = false;
    forceReconnect();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Audio Visualizer Background */}
      <AudioVisualizer audioElement={audioElement} isPlaying={isPlaying && !showWelcome} />
      
      {/* WELCOME OVERLAY */}
      {showWelcome && (
        <div
          data-testid="welcome-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(5,5,5,0.98) 0%, rgba(10,10,15,0.98) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="text-center px-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-full px-4 py-2 text-sm uppercase tracking-[0.2em] font-bold animate-pulse mb-8">
              <span className="w-3 h-3 bg-[#FF003C] rounded-full"></span>
              TRANSMITIENDO EN VIVO
            </div>
            
            <div className="mb-5">
              <img
                src="/icons/salsamixlive-hero-logo.png"
                alt="SalsaMixLive.com"
                className="mx-auto w-full max-w-[460px] rounded-xl"
              />
            </div>
            
            <p className="text-xl sm:text-2xl text-white mb-2 font-medium">
              DJ Kaleñita desde NY para el mundo entero!
            </p>

            <p className="text-lg sm:text-xl text-[#A1A1AA] mb-4 font-medium">
              🎵 La mejor salsa colombiana 24/7
            </p>
            
            {streamMetadata && streamMetadata.title && (
              <p className="text-lg text-[#00E5FF] mb-4 animate-pulse">
                Ahora: {streamMetadata.title}
              </p>
            )}
            
            <button
              onClick={startPlaying}
              className="inline-flex items-center gap-3 bg-[#FFE600] text-black px-12 py-6 rounded-full text-2xl font-black hover:scale-110 transition-transform shadow-2xl"
              style={{ border: '4px solid #00E5FF' }}
            >
              <Play className="w-10 h-10" fill="currentColor" />
              ENTRAR Y ESCUCHAR
            </button>
            
            <p className="text-sm text-[#A1A1AA] mt-6">
              Haz click para comenzar la transmisión
            </p>
          </div>
        </div>
      )}

      {/* PLAYER BAR */}
      <div
        data-testid="audio-player"
        className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              data-testid="play-pause-button"
              onClick={togglePlayPause}
              disabled={isReconnecting}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isPlaying 
                  ? 'bg-[#FF003C] hover:bg-[#FF003C]/80' 
                  : 'bg-[#FFE600] hover:bg-[#FFE600]/80'
              } ${isReconnecting ? 'opacity-50' : ''}`}
            >
              {isReconnecting ? (
                <RefreshCw className="w-6 h-6 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 text-black" fill="black" />
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Connection status indicator */}
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} title={connectionStatus} />
                
                {isReconnecting ? (
                  <span className="inline-flex items-center gap-1 bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600] rounded-full px-3 py-1 text-sm uppercase tracking-wider font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    RECONECTANDO...
                  </span>
                ) : isBuffering ? (
                  <span className="inline-flex items-center gap-1 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] rounded-full px-3 py-1 text-sm uppercase tracking-wider font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    CARGANDO...
                  </span>
                ) : connectionStatus === 'error' ? (
                  <span className="inline-flex items-center gap-1 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-full px-3 py-1 text-sm uppercase tracking-wider font-bold">
                    <WifiOff className="w-3 h-3" />
                    SIN CONEXIÓN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-full px-3 py-1 text-sm uppercase tracking-wider font-bold animate-pulse">
                    <span className="w-3 h-3 bg-[#FF003C] rounded-full animate-pulse-glow"></span>
                    {isPlaying ? 'REPRODUCIENDO' : 'EN VIVO'}
                  </span>
                )}
                
                {/* Manual reconnect button */}
                {(connectionStatus === 'error' || isBuffering) && (
                  <button
                    onClick={manualReconnect}
                    className="ml-2 p-1 text-[#FFE600] hover:text-[#00E5FF] transition-colors"
                    title="Reconectar manualmente"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {!isPlaying && !isReconnecting && !isBuffering && connectionStatus !== 'error' && (
                <p className="text-lg font-bold text-[#FFE600] mb-2">
                  👈 HAZ CLICK EN EL BOTÓN AMARILLO
                </p>
              )}
            
              {streamMetadata && streamMetadata.title && isPlaying ? (
                <div className="flex items-center gap-4">
                  <Marquee gradient={false} speed={40} className="text-base flex-1">
                    <span className="mr-8 text-white font-medium">
                      🎵 {streamMetadata.artist && <span className="text-[#FFE600]">{streamMetadata.artist}</span>}
                      {streamMetadata.artist && streamMetadata.song && <span className="text-[#A1A1AA]"> - </span>}
                      {streamMetadata.song && <span className="text-[#00E5FF]">{streamMetadata.song}</span>}
                      {!streamMetadata.artist && !streamMetadata.song && streamMetadata.title}
                    </span>
                  </Marquee>
                  {streamMetadata.listeners > 0 && (
                    <span className="hidden sm:flex items-center gap-1 text-sm text-[#A1A1AA] whitespace-nowrap">
                      <span className="text-[#FFE600] font-bold">{streamMetadata.listeners}</span> oyentes
                    </span>
                  )}
                </div>
              ) : streamMetadata && streamMetadata.title ? (
                <p className="text-sm text-[#A1A1AA]">
                  🎵 {streamMetadata.title}
                </p>
              ) : (
                <p className="text-sm text-[#A1A1AA]">
                  SalsaMixLive - La mejor salsa colombiana 24/7
                </p>
              )}
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-2 text-[#A1A1AA] hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00E5FF] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* Direct Stream Link */}
            <a
              href="http://cast1.asurahosting.com:7527/autodj"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#00E5FF] text-black rounded-xl hover:scale-105 transition-transform text-sm font-bold"
            >
              <Wifi className="w-4 h-4" />
              Abrir en VLC
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalAudioPlayer;
