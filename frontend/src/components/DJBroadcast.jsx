import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Radio, Users, Clock, Volume2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
// Convert https to wss for WebSocket, and use /api/ws/ path
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const DJBroadcast = () => {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [djName, setDjName] = useState('');
  const [error, setError] = useState('');
  const [listenerCount, setListenerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputSource, setInputSource] = useState('microphone'); // microphone, system, both
  const [isSupported, setIsSupported] = useState(true);
  
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isChrome = /CriOS/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent);
      
      // Check if we're on HTTPS (required for mediaDevices)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      
      // Check if mediaDevices is available
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Check if MediaRecorder is available
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      
      if (isIOS && isChrome) {
        setError('⚠️ Chrome en iPhone no soporta transmisión de audio. Por favor usa SAFARI para transmitir desde tu iPhone.');
        setIsSupported(false);
      } else if (isIOS && !hasMediaDevices) {
        setError('⚠️ Para transmitir desde iPhone, abre esta página en SAFARI (no Chrome ni otros navegadores).');
        setIsSupported(false);
      } else if (!isSecure) {
        setError('La transmisión requiere HTTPS. Accede al sitio con https://');
        setIsSupported(false);
      } else if (!hasMediaDevices) {
        setError('Tu navegador no soporta captura de audio. Usa Chrome, Firefox o Safari actualizado.');
        setIsSupported(false);
      } else if (!hasMediaRecorder) {
        setError('Tu navegador no soporta grabación de audio. Actualiza tu navegador.');
        setIsSupported(false);
      }
    };
    
    checkSupport();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBroadcast();
    };
  }, []);

  const getMediaConstraints = () => {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: false
    };

    // For system audio (requires screen capture)
    if (inputSource === 'system' || inputSource === 'both') {
      return { audio: true, video: false };
    }

    return constraints;
  };

  const startBroadcast = async () => {
    if (!djName.trim()) {
      setError('Por favor ingresa tu nombre de DJ');
      return;
    }

    setError('');

    // Verificar que mediaDevices esté disponible (requiere HTTPS)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Tu navegador no soporta transmisión de audio. Asegúrate de usar HTTPS y un navegador moderno (Chrome, Firefox, Safari).');
      return;
    }

    try {
      // Get audio stream
      let stream;
      
      if (inputSource === 'system') {
        // Request system audio via screen capture (for mixer/console audio)
        if (!navigator.mediaDevices.getDisplayMedia) {
          setError('Tu navegador no soporta captura de audio del sistema. Usa el micrófono.');
          return;
        }
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true // Algunos navegadores requieren video para getDisplayMedia
          });
          // Detener el video track si existe (solo necesitamos audio)
          stream.getVideoTracks().forEach(track => track.stop());
        } catch (displayError) {
          console.log('getDisplayMedia failed, falling back to mic:', displayError);
          setError('Audio del sistema no disponible. Usando micrófono...');
          stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
      }

      if (!stream) {
        setError('No se pudo obtener acceso al audio. Verifica los permisos.');
        return;
      }

      mediaStreamRef.current = stream;

      // Setup audio analyser for level visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start level monitoring
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255 * 100);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      // Connect WebSocket
      const token = localStorage.getItem('token');
      const ws = new WebSocket(`${WS_URL}/api/ws/dj-broadcast/${encodeURIComponent(djName)}?token=${token}`);
      
      ws.onopen = () => {
        console.log('DJ WebSocket connected');
        setIsLive(true);
        
        // Start duration counter
        durationIntervalRef.current = setInterval(() => {
          setStreamDuration(prev => prev + 1);
        }, 1000);
      };

      ws.onclose = (event) => {
        console.log('DJ WebSocket closed', event.code, event.reason);
        if (event.code === 4001) {
          setError('Otro DJ ya está transmitiendo. Espera tu turno.');
        } else if (event.code === 4003) {
          setError('No autorizado para transmitir');
        }
        stopBroadcast();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Error de conexión. Intenta de nuevo.');
        stopBroadcast();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.listener_count !== undefined) {
            setListenerCount(data.listener_count);
          }
        } catch (e) {
          // Binary data, ignore
        }
      };

      wsRef.current = ws;

      // Setup MediaRecorder to capture and send audio
      // Check supported mimeTypes
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }

      const recorderOptions = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 };
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          wsRef.current.send(arrayBuffer);
        }
      };

      mediaRecorder.start(100); // Send audio chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;

    } catch (err) {
      console.error('Error starting broadcast:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de micrófono denegado. Habilita el acceso al micrófono en la configuración de tu navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se encontró micrófono. Conecta un micrófono y recarga la página.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('El micrófono está siendo usado por otra aplicación. Cierra otras apps y vuelve a intentar.');
      } else if (err.name === 'OverconstrainedError') {
        setError('No se pudo configurar el audio. Intenta con otra fuente de audio.');
      } else if (err.name === 'TypeError') {
        setError('Error de configuración. Asegúrate de usar HTTPS.');
      } else {
        setError(`Error al iniciar: ${err.message || 'Verifica permisos y conexión'}`);
      }
      stopBroadcast();
    }
  };

  const stopBroadcast = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaStreamRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    wsRef.current = null;

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop duration counter
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setIsLive(false);
    setStreamDuration(0);
    setAudioLevel(0);
    setListenerCount(0);
  }, []);

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`glass-effect rounded-2xl p-6 border-2 ${isLive ? 'border-[#FF003C] bg-[#FF003C]/10' : 'border-white/10'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-[#FF003C] animate-pulse' : 'bg-[#A1A1AA]'}`} />
            <h2 className="text-2xl font-bold">
              {isLive ? 'EN VIVO' : 'DJ Broadcast'}
            </h2>
          </div>
          {isLive && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#00E5FF]">
                <Users className="w-4 h-4" />
                <span>{listenerCount} oyentes</span>
              </div>
              <div className="flex items-center gap-2 text-[#FFE600]">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(streamDuration)}</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[#FF003C]/20 border border-[#FF003C] rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF003C]" />
            <span className="text-[#FF003C]">{error}</span>
          </div>
        )}

        {!isLive ? (
          <div className="space-y-4">
            {/* DJ Name Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Tu nombre de DJ <span className="text-[#FF003C]">*</span></label>
              <input
                type="text"
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                placeholder="Ej: DJ Salsa Master"
                className={`w-full bg-[#0F0F13] border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] ${
                  djName.trim() ? 'border-[#00E5FF]' : 'border-white/10'
                }`}
              />
              {!djName.trim() && (
                <p className="text-xs text-[#FFE600] mt-1">⚠️ Escribe tu nombre para habilitar la transmisión</p>
              )}
            </div>

            {/* Audio Source Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Fuente de audio</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setInputSource('microphone')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    inputSource === 'microphone'
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-[#0F0F13] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Mic className="w-5 h-5 mx-auto mb-1" />
                  Micrófono
                </button>
                <button
                  onClick={() => setInputSource('system')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    inputSource === 'system'
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-[#0F0F13] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Volume2 className="w-5 h-5 mx-auto mb-1" />
                  Sistema/Mixer
                </button>
                <button
                  onClick={() => setInputSource('both')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    inputSource === 'both'
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-[#0F0F13] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Radio className="w-5 h-5 mx-auto mb-1" />
                  Ambos
                </button>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-2">
                {inputSource === 'microphone' && 'Usa el micrófono de tu dispositivo para hablar'}
                {inputSource === 'system' && 'Transmite el audio de tu consola/mixer (requiere compartir pantalla)'}
                {inputSource === 'both' && 'Combina micrófono con audio del sistema'}
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={startBroadcast}
              disabled={!djName.trim() || !isSupported}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FF003C] text-white font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Radio className="w-6 h-6" />
              {isSupported ? 'EMPEZAR TRANSMISIÓN' : 'NO DISPONIBLE'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Audio Level Meter */}
            <div>
              <label className="block text-sm font-medium mb-2">Nivel de Audio</label>
              <div className="h-4 bg-[#0F0F13] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] via-[#FFE600] to-[#FF003C] transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">
                {isMuted ? '🔇 SILENCIADO' : audioLevel > 10 ? '🎤 Transmitiendo...' : '🎤 Esperando audio...'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={toggleMute}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  isMuted
                    ? 'bg-[#FFE600] text-black'
                    : 'bg-[#0F0F13] border border-white/10 text-white hover:border-white/30'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isMuted ? 'Activar Mic' : 'Silenciar'}
              </button>
              
              <button
                onClick={stopBroadcast}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FF003C] text-white font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                TERMINAR
              </button>
            </div>

            {/* Live Info */}
            <div className="p-4 bg-[#0F0F13] rounded-xl">
              <p className="text-sm text-[#A1A1AA]">
                Transmitiendo como: <span className="text-[#00E5FF] font-bold">{djName}</span>
              </p>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Los oyentes pueden escucharte en la página principal
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="font-bold mb-4">Instrucciones para transmitir</h3>
        <ul className="space-y-2 text-sm text-[#A1A1AA]">
          <li className="flex items-start gap-2">
            <span className="text-[#FFE600]">1.</span>
            <span>Ingresa tu nombre de DJ (aparecerá para los oyentes)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFE600]">2.</span>
            <span>Selecciona la fuente de audio:</span>
          </li>
          <li className="ml-6 text-xs">
            • <strong>Micrófono:</strong> Para saludos y locución
          </li>
          <li className="ml-6 text-xs">
            • <strong>Sistema/Mixer:</strong> Para transmitir música de tu consola
          </li>
          <li className="ml-6 text-xs">
            • <strong>Ambos:</strong> Para mezclar voz con música
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFE600]">3.</span>
            <span>Permite acceso al micrófono cuando el navegador lo solicite</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFE600]">4.</span>
            <span>¡Ya estás en vivo! Los oyentes te escucharán en tiempo real</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DJBroadcast;
