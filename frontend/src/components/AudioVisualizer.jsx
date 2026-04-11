import React, { useEffect, useRef, useState } from 'react';

const AudioVisualizer = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!audioElement || !isPlaying) {
      // Draw static waves when not playing
      drawStaticWaves();
      return;
    }

    // Only connect once
    if (!isConnected && audioElement) {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        // Connect audio element to analyser
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        setIsConnected(true);
      } catch (e) {
        console.log('Audio visualizer: Could not connect to audio', e);
        drawStaticWaves();
        return;
      }
    }

    // Start visualization
    if (isConnected && analyserRef.current) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying, isConnected]);

  const drawStaticWaves = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle static waves
    const time = Date.now() * 0.001;
    
    // Yellow wave
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.3)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * 0.02 + time) * 30;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Cyan wave
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * 0.015 + time * 1.2) * 40;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Red wave
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.3)';
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * 0.025 + time * 0.8) * 25;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    animationRef.current = requestAnimationFrame(drawStaticWaves);
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Get frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    const time = Date.now() * 0.001;
    
    // Calculate average for overall intensity
    const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    const intensity = average / 255;
    
    // Draw multiple wave layers
    drawWaveLayer(ctx, dataArray, width, height, {
      color: `rgba(255, 230, 0, ${0.3 + intensity * 0.5})`, // Yellow
      offset: 0,
      amplitude: 80 + intensity * 50,
      frequency: 0.02,
      timeOffset: time,
      lineWidth: 3 + intensity * 2
    });
    
    drawWaveLayer(ctx, dataArray, width, height, {
      color: `rgba(0, 229, 255, ${0.3 + intensity * 0.5})`, // Cyan
      offset: Math.PI / 3,
      amplitude: 60 + intensity * 40,
      frequency: 0.015,
      timeOffset: time * 1.2,
      lineWidth: 2 + intensity * 2
    });
    
    drawWaveLayer(ctx, dataArray, width, height, {
      color: `rgba(255, 0, 60, ${0.3 + intensity * 0.5})`, // Red
      offset: Math.PI / 1.5,
      amplitude: 70 + intensity * 45,
      frequency: 0.025,
      timeOffset: time * 0.8,
      lineWidth: 2.5 + intensity * 2
    });
    
    // Draw frequency bars at bottom
    drawFrequencyBars(ctx, dataArray, width, height);
    
    // Draw circular pulse in center
    drawCentralPulse(ctx, width, height, intensity, time);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const drawWaveLayer = (ctx, dataArray, width, height, options) => {
    const { color, offset, amplitude, frequency, timeOffset, lineWidth } = options;
    const bufferLength = dataArray.length;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Create gradient stroke
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(255, 230, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 60, 0.8)');
    
    for (let x = 0; x < width; x++) {
      // Get frequency data for this position
      const dataIndex = Math.floor((x / width) * bufferLength);
      const frequencyValue = dataArray[dataIndex] / 255;
      
      // Calculate wave with frequency influence
      const baseWave = Math.sin(x * frequency + timeOffset + offset);
      const frequencyWave = Math.sin(x * frequency * 2 + timeOffset * 2) * frequencyValue;
      
      const y = height / 2 + (baseWave * amplitude * 0.5) + (frequencyWave * amplitude);
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawFrequencyBars = (ctx, dataArray, width, height) => {
    const barCount = 64;
    const barWidth = width / barCount;
    const bufferLength = dataArray.length;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex] / 255;
      const barHeight = value * height * 0.3;
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Color based on position (yellow -> cyan -> red)
      let color;
      if (i < barCount / 3) {
        color = `rgba(255, 230, 0, ${0.3 + value * 0.5})`;
      } else if (i < (barCount * 2) / 3) {
        color = `rgba(0, 229, 255, ${0.3 + value * 0.5})`;
      } else {
        color = `rgba(255, 0, 60, ${0.3 + value * 0.5})`;
      }
      
      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, height, x, y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  };

  const drawCentralPulse = (ctx, width, height, intensity, time) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 150 + intensity * 100;
    
    // Draw multiple rings
    for (let i = 0; i < 3; i++) {
      const phase = (time * 2 + i * 0.5) % 1;
      const radius = maxRadius * phase;
      const alpha = (1 - phase) * (0.3 + intensity * 0.3);
      
      const colors = ['rgba(255, 230, 0,', 'rgba(0, 229, 255,', 'rgba(255, 0, 60,'];
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors[i % 3]}${alpha})`;
      ctx.lineWidth = 2 + intensity * 3;
      ctx.stroke();
    }
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ 
        opacity: 0.6,
        mixBlendMode: 'screen'
      }}
    />
  );
};

export default AudioVisualizer;
