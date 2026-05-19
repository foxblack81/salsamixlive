import React, { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const WeatherTicker = () => {
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
    // Actualizar cada 10 minutos
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`${API}/weather`);
      setWeather(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather([]);
      setLoading(false);
    }
  };

  if (loading || weather.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#0A0A0F] via-[#0F0F13] to-[#0A0A0F] border-y border-white/10 py-3">
      <Marquee
        gradient={true}
        gradientColor="#0A0A0F"
        gradientWidth={50}
        speed={40}
        pauseOnHover={true}
      >
        {weather.map((city, index) => (
          <div key={index} className="flex items-center mx-8">
            <span className="text-2xl mr-2">{city.icon}</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">
                {city.city}, {city.country}
              </span>
              <span className="text-[#FFE600] font-bold text-lg">
                {city.temp_c}°C
              </span>
              <span className="text-[#A1A1AA] text-sm">
                ({city.temp_f}°F)
              </span>
              <span className="text-[#00E5FF] text-sm">
                {city.condition}
              </span>
              <span className="text-[#A1A1AA] text-sm">
                💧 {city.humidity}%
              </span>
            </div>
            <span className="mx-6 text-[#A1A1AA]">|</span>
          </div>
        ))}
        <div className="flex items-center mx-8 text-[#FF003C]">
          <span className="animate-pulse">🔴</span>
          <span className="ml-2 font-bold">EN VIVO</span>
          <span className="ml-2 text-white">SalsaMixLive.com - La mejor salsa colombiana 24/7</span>
          <span className="mx-6 text-[#A1A1AA]">|</span>
        </div>
      </Marquee>
    </div>
  );
};

export default WeatherTicker;
