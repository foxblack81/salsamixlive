import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Users, Calendar } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div data-testid="bottom-navigation" className="md:hidden fixed bottom-20 left-0 right-0 z-40 glass-effect border-t border-white/10">
      <div className="flex items-center justify-around py-3">
        <Link
          to="/"
          data-testid="bottom-nav-home"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/') ? 'text-[#FFE600]' : 'text-[#A1A1AA]'
          }`}
        >
          <Radio className="w-6 h-6" />
          <span className="text-xs font-medium">Inicio</span>
        </Link>
        <Link
          to="/djs"
          data-testid="bottom-nav-djs"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/djs') ? 'text-[#FFE600]' : 'text-[#A1A1AA]'
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs font-medium">DJs</span>
        </Link>
        <Link
          to="/schedule"
          data-testid="bottom-nav-schedule"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/schedule') ? 'text-[#FFE600]' : 'text-[#A1A1AA]'
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium">Programación</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;