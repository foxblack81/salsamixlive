import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Users, Calendar, UserCog } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav data-testid="main-navbar" className="sticky top-0 z-40 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2">
            <Radio className="w-8 h-8 text-[#FFE600]" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Salsa<span className="text-[#FFE600]">Mix</span><span className="text-[#00E5FF]">Live</span>
            </h1>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              data-testid="navbar-home"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/') ? 'text-[#FFE600]' : 'text-white hover:text-[#00E5FF]'
              }`}
            >
              <Radio className="w-4 h-4" />
              Inicio
            </Link>
            <Link
              to="/djs"
              data-testid="navbar-djs"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/djs') ? 'text-[#FFE600]' : 'text-white hover:text-[#00E5FF]'
              }`}
            >
              <Users className="w-4 h-4" />
              DJs
            </Link>
            <Link
              to="/schedule"
              data-testid="navbar-schedule"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/schedule') ? 'text-[#FFE600]' : 'text-white hover:text-[#00E5FF]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Programación
            </Link>
            <Link
              to="/admin/login"
              data-testid="navbar-admin"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/admin/login') ? 'text-[#FF003C]' : 'text-[#A1A1AA] hover:text-[#FF003C]'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Admin
            </Link>
          </div>

          {/* Mobile Menu (Bottom Nav is separate) */}
          <div className="md:hidden">
            <Link
              to="/admin/login"
              data-testid="navbar-admin-mobile"
              className="text-[#A1A1AA] hover:text-[#FF003C]"
            >
              <UserCog className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;