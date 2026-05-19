import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Volume2, VolumeX, User } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
const API = `${BACKEND_URL}/api`;

const DJLiveListener = ({ onDJStatusChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [djStatus, setDjStatus] = useState({ is_live: false, dj_name: null, listener_count: 0 });
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Check DJ status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API}/dj-live/status`);
        setDjStatus(response.data);
        if (onDJStatusChange) {
          onDJStatusChange(response.data);
        }
      } catch (error) {
        console.error('Error checking DJ status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [onDJStatusChange]);

  // Connect to DJ stream when live
  useEffect(() => {
    if (djStatus.is_live && !isConnected) {
      connectToStream();
    } else if (!djStatus.is_live && isConnected) {
      disconnectFromStream();
    }
  }, [djStatus.is_live]);

  const connectToStream = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(`${WS_URL}/api/ws/dj-listen`);
    
    ws.onopen = () => {
      console.log('Connected to DJ stream');
      setIsConnected(true);
      
      // Initialize Web Audio API
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume / 100;
    };

    ws.onclose = () => {
      console.log('Disconnected from DJ stream');
      setIsConnected(false);
      setIsPlaying(false);
    };

    ws.onerror = (error) => {
      console.error('DJ stream error:', error);
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        // Audio data received
        try {
          const arrayBuffer = await event.data.arrayBuffer();
          playAudioChunk(arrayBuffer);
        } catch (e) {
          console.error('Error processing audio:', e);
        }
      } else {
        // JSON message (status update)
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setDjStatus(data);
          }
        } catch (e) {
          // Not JSON
        }
      }
    };

    wsRef.current = ws;

    // Send keepalive pings
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [volume]);

  const playAudioChunk = async (arrayBuffer) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    try {
      // Resume audio context if suspended (required for autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      source.start(0);
      
      setIsPlaying(true);
      isPlayingRef.current = true;

      source.onended = () => {
        // Chunk finished playing
      };
    } catch (e) {
      // May fail to decode some chunks, that's okay
    }
  };

  const disconnectFromStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsPlaying(false);
  }, []);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : newVolume / 100;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newMuted ? 0 : volume / 100;
    }
  };

  // Don't render if DJ is not live
  if (!djStatus.is_live) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-[#FF003C]/90 backdrop-blur-lg text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wider">DJ EN VIVO</span>
        </div>

        {/* DJ Name */}
        <div className="flex items-center gap-2 border-l border-white/30 pl-4">
          <User className="w-4 h-4" />
          <span className="font-medium">{djStatus.dj_name}</span>
        </div>

        {/* Listener count */}
        <div className="text-sm opacity-80">
          {djStatus.listener_count} oyentes
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2 border-l border-white/30 pl-4">
          <button onClick={toggleMute} className="hover:scale-110 transition-transform">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DJLiveListener;
