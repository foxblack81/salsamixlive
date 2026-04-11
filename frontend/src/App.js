import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import DJs from './pages/DJs';
import Schedule from './pages/Schedule';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Player from './pages/Player';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import LiveChat from './components/LiveChat';
import DJLiveListener from './components/DJLiveListener';
import './App.css';

// Wrapper component to conditionally render GlobalAudioPlayer and LiveChat
const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <div className="App min-h-screen bg-[#050505] text-white pb-32">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/djs" element={<DJs />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/player" element={<Player />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      {!isAdminPage && <GlobalAudioPlayer />}
      {!isAdminPage && <LiveChat />}
      {!isAdminPage && <DJLiveListener />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;