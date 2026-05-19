import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`${API}/schedule`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedSchedule = DAYS.reduce((acc, day, index) => {
    acc[index] = schedule.filter(item => item.day_of_week === index);
    return acc;
  }, {});

  return (
    <div data-testid="schedule-page" className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-[#FFE600]" />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Programación</h1>
        </div>
        
        <p className="text-lg text-[#A1A1AA] mb-12 max-w-3xl">
          Descubre cuándo están al aire tus DJs favoritos. Todos los horarios en hora de Colombia.
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {DAYS.map((day, index) => (
              <div key={index} data-testid={`schedule-day-${index}`} className="glass-effect rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6 text-[#00E5FF]">{day}</h2>
                
                {groupedSchedule[index]?.length > 0 ? (
                  <div className="space-y-4">
                    {groupedSchedule[index].map((item) => (
                      <div
                        key={item.id}
                        data-testid={`schedule-item-${item.id}`}
                        className="bg-[#0F0F13] border border-white/10 rounded-xl p-5 hover:border-[#FFE600]/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">{item.show_name}</h3>
                            <p className="text-[#00E5FF] mb-2">con {item.dj_name}</p>
                            {item.description && (
                              <p className="text-sm text-[#A1A1AA]">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[#A1A1AA]">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-sm">
                              {item.start_time} - {item.end_time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#A1A1AA] text-center py-8">
                    No hay programación para este día
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Schedule;