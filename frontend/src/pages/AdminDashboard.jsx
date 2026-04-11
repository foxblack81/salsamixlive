import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Radio as RadioIcon, Calendar, Plus, Trash2, Edit, Save, X, Share2, Megaphone, Image, Upload, Mic } from 'lucide-react';
import axios from 'axios';
import DJBroadcast from '../components/DJBroadcast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('stream');
  const [user, setUser] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [djs, setDjs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '', instagram: '', tiktok: '', youtube: '', twitter: ''
  });
  const [advertisements, setAdvertisements] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [newDJ, setNewDJ] = useState({ username: '', email: '', password: '', full_name: '' });
  const [newTrack, setNewTrack] = useState({ title: '', artist: '', album: '', duration: 0 });
  const [newSchedule, setNewSchedule] = useState({
    dj_id: '',
    dj_name: '',
    day_of_week: 0,
    start_time: '',
    end_time: '',
    show_name: '',
    description: ''
  });
  const [newAd, setNewAd] = useState({
    title: '', description: '', image_url: '', link_url: '', is_active: true, order: 0
  });
  const [editingStream, setEditingStream] = useState(false);
  const [streamUpdate, setStreamUpdate] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchAllData();
  }, [navigate]);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchAllData = async () => {
    try {
      const [statusRes, djsRes, scheduleRes, tracksRes, socialRes, adsRes] = await Promise.all([
        axios.get(`${API}/stream/status`),
        axios.get(`${API}/djs`),
        axios.get(`${API}/schedule`),
        axios.get(`${API}/tracks/history?limit=10`),
        axios.get(`${API}/social-links`),
        axios.get(`${API}/advertisements?active_only=false`)
      ]);
      setStreamStatus(statusRes.data);
      setDjs(djsRes.data);
      setSchedule(scheduleRes.data);
      setTracks(tracksRes.data);
      setSocialLinks(socialRes.data);
      setAdvertisements(adsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleUpdateStream = async () => {
    try {
      await axios.put(`${API}/stream/status`, streamUpdate, getAuthHeader());
      setEditingStream(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating stream:', error);
    }
  };

  const handleCreateDJ = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auth/register`, { ...newDJ, role: 'dj' }, getAuthHeader());
      setNewDJ({ username: '', email: '', password: '', full_name: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error creating DJ:', error);
      alert(error.response?.data?.detail || 'Error al crear DJ');
    }
  };

  const handleDeleteDJ = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este DJ?')) return;
    try {
      await axios.delete(`${API}/djs/${id}`, getAuthHeader());
      fetchAllData();
    } catch (error) {
      console.error('Error deleting DJ:', error);
    }
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tracks`, newTrack, getAuthHeader());
      setNewTrack({ title: '', artist: '', album: '', duration: 0 });
      fetchAllData();
    } catch (error) {
      console.error('Error creating track:', error);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/schedule`, newSchedule, getAuthHeader());
      setNewSchedule({
        dj_id: '',
        dj_name: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        show_name: '',
        description: ''
      });
      fetchAllData();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;
    try {
      await axios.delete(`${API}/schedule/${id}`, getAuthHeader());
      fetchAllData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleUpdateSocialLinks = async () => {
    try {
      await axios.put(`${API}/social-links`, socialLinks, getAuthHeader());
      alert('Redes sociales actualizadas');
    } catch (error) {
      console.error('Error updating social links:', error);
      alert('Error al actualizar redes sociales');
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.image_url) {
      alert('Por favor sube una imagen primero');
      return;
    }
    try {
      await axios.post(`${API}/advertisements`, newAd, getAuthHeader());
      setNewAd({ title: '', description: '', image_url: '', link_url: '', is_active: true, order: 0 });
      fetchAllData();
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Error al crear publicidad');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload/image`, formData, {
        ...getAuthHeader(),
        headers: {
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Construir URL completa
      const imageUrl = `${BACKEND_URL}${response.data.url}`;
      setNewAd({ ...newAd, image_url: imageUrl });
      alert('Imagen subida exitosamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicidad?')) return;
    try {
      await axios.delete(`${API}/advertisements/${id}`, getAuthHeader());
      fetchAllData();
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const handleToggleAd = async (ad) => {
    try {
      await axios.put(`${API}/advertisements/${ad.id}`, { is_active: !ad.is_active }, getAuthHeader());
      fetchAllData();
    } catch (error) {
      console.error('Error toggling ad:', error);
    }
  };

  if (!user) return null;

  return (
    <div data-testid="admin-dashboard-page" className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">Panel de Control</h1>
          <p className="text-[#A1A1AA]">Bienvenido, {user.username}</p>
        </div>
        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C] rounded-xl hover:bg-[#FF003C]/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-effect rounded-2xl p-2 mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { id: 'stream', label: 'Stream', icon: RadioIcon },
          { id: 'djs', label: 'DJs', icon: Users },
          { id: 'schedule', label: 'Programación', icon: Calendar },
          { id: 'tracks', label: 'Tracks', icon: RadioIcon },
          { id: 'social', label: 'Redes', icon: Share2 },
          { id: 'ads', label: 'Publicidad', icon: Megaphone },
          { id: 'djlive', label: 'DJ En Vivo', icon: Mic }
        ].map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#FFE600] text-black'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stream Tab */}
      {activeTab === 'stream' && streamStatus && (
        <div data-testid="stream-management" className="glass-effect rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Estado del Stream</h2>
          
          {!editingStream ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl">
                <span className="text-[#A1A1AA]">Estado:</span>
                <span className={`font-bold ${streamStatus.is_live ? 'text-[#FF003C]' : 'text-white'}`}>
                  {streamStatus.is_live ? 'EN VIVO' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl">
                <span className="text-[#A1A1AA]">DJ Actual:</span>
                <span className="font-bold">{streamStatus.current_dj || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl">
                <span className="text-[#A1A1AA]">Oyentes:</span>
                <span className="font-bold text-[#00E5FF]">{streamStatus.listeners}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl">
                <span className="text-[#A1A1AA]">URL Stream:</span>
                <span className="font-mono text-sm">{streamStatus.stream_url || 'No configurado'}</span>
              </div>
              <button
                data-testid="edit-stream-button"
                onClick={() => {
                  setEditingStream(true);
                  setStreamUpdate({
                    is_live: streamStatus.is_live,
                    stream_url: streamStatus.stream_url || '',
                    current_dj: streamStatus.current_dj || '',
                    listeners: streamStatus.listeners
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00E5FF] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                <Edit className="w-4 h-4" />
                Editar Estado
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estado del Stream</label>
                <select
                  data-testid="stream-status-select"
                  value={streamUpdate.is_live}
                  onChange={(e) => setStreamUpdate({ ...streamUpdate, is_live: e.target.value === 'true' })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                >
                  <option value="true">EN VIVO</option>
                  <option value="false">OFFLINE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">DJ Actual</label>
                <input
                  data-testid="stream-dj-input"
                  type="text"
                  value={streamUpdate.current_dj}
                  onChange={(e) => setStreamUpdate({ ...streamUpdate, current_dj: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL del Stream</label>
                <input
                  data-testid="stream-url-input"
                  type="text"
                  value={streamUpdate.stream_url}
                  onChange={(e) => setStreamUpdate({ ...streamUpdate, stream_url: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Número de Oyentes</label>
                <input
                  data-testid="stream-listeners-input"
                  type="number"
                  value={streamUpdate.listeners}
                  onChange={(e) => setStreamUpdate({ ...streamUpdate, listeners: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  data-testid="save-stream-button"
                  onClick={handleUpdateStream}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  data-testid="cancel-stream-button"
                  onClick={() => setEditingStream(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0F0F13] border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DJs Tab */}
      {activeTab === 'djs' && (
        <div data-testid="djs-management" className="space-y-6">
          {/* Create DJ Form */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Crear Nuevo DJ</h2>
            <form onSubmit={handleCreateDJ} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  data-testid="create-dj-username"
                  type="text"
                  placeholder="Usuario"
                  value={newDJ.username}
                  onChange={(e) => setNewDJ({ ...newDJ, username: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
                <input
                  data-testid="create-dj-email"
                  type="email"
                  placeholder="Email"
                  value={newDJ.email}
                  onChange={(e) => setNewDJ({ ...newDJ, email: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  data-testid="create-dj-fullname"
                  type="text"
                  placeholder="Nombre Completo"
                  value={newDJ.full_name}
                  onChange={(e) => setNewDJ({ ...newDJ, full_name: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
                <input
                  data-testid="create-dj-password"
                  type="password"
                  placeholder="Contraseña"
                  value={newDJ.password}
                  onChange={(e) => setNewDJ({ ...newDJ, password: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
              </div>
              <button
                type="submit"
                data-testid="submit-create-dj"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                Crear DJ
              </button>
            </form>
          </div>

          {/* DJs List */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Lista de DJs ({djs.length})</h2>
            <div className="space-y-3">
              {djs.map((dj) => (
                <div
                  key={dj.id}
                  data-testid={`dj-item-${dj.id}`}
                  className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl border border-white/10"
                >
                  <div>
                    <p className="font-bold">{dj.full_name || dj.username}</p>
                    <p className="text-sm text-[#A1A1AA]">{dj.email}</p>
                  </div>
                  <button
                    data-testid={`delete-dj-${dj.id}`}
                    onClick={() => handleDeleteDJ(dj.id)}
                    className="p-2 text-[#FF003C] hover:bg-[#FF003C]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div data-testid="schedule-management" className="space-y-6">
          {/* Create Schedule Form */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Crear Horario</h2>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <select
                  data-testid="create-schedule-dj"
                  value={newSchedule.dj_id}
                  onChange={(e) => {
                    const selectedDJ = djs.find(dj => dj.id === e.target.value);
                    setNewSchedule({
                      ...newSchedule,
                      dj_id: e.target.value,
                      dj_name: selectedDJ ? selectedDJ.full_name || selectedDJ.username : ''
                    });
                  }}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                >
                  <option value="">Seleccionar DJ</option>
                  {djs.map((dj) => (
                    <option key={dj.id} value={dj.id}>
                      {dj.full_name || dj.username}
                    </option>
                  ))}
                </select>
                <select
                  data-testid="create-schedule-day"
                  value={newSchedule.day_of_week}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(e.target.value) })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                >
                  {DAYS.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  data-testid="create-schedule-start"
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
                <input
                  data-testid="create-schedule-end"
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
              </div>
              <input
                data-testid="create-schedule-show-name"
                type="text"
                placeholder="Nombre del Programa"
                value={newSchedule.show_name}
                onChange={(e) => setNewSchedule({ ...newSchedule, show_name: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                required
              />
              <textarea
                data-testid="create-schedule-description"
                placeholder="Descripción (opcional)"
                value={newSchedule.description}
                onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] min-h-[100px]"
              />
              <button
                type="submit"
                data-testid="submit-create-schedule"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                Crear Horario
              </button>
            </form>
          </div>

          {/* Schedule List */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Programación Actual ({schedule.length})</h2>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  data-testid={`schedule-item-admin-${item.id}`}
                  className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl border border-white/10"
                >
                  <div>
                    <p className="font-bold">{item.show_name}</p>
                    <p className="text-sm text-[#00E5FF]">{item.dj_name}</p>
                    <p className="text-sm text-[#A1A1AA]">
                      {DAYS[item.day_of_week]} • {item.start_time} - {item.end_time}
                    </p>
                  </div>
                  <button
                    data-testid={`delete-schedule-${item.id}`}
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="p-2 text-[#FF003C] hover:bg-[#FF003C]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tracks Tab */}
      {activeTab === 'tracks' && (
        <div data-testid="tracks-management" className="space-y-6">
          {/* Create Track Form */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Añadir Track Reproducido</h2>
            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  data-testid="create-track-title"
                  type="text"
                  placeholder="Título de la canción"
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
                <input
                  data-testid="create-track-artist"
                  type="text"
                  placeholder="Artista"
                  value={newTrack.artist}
                  onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  data-testid="create-track-album"
                  type="text"
                  placeholder="Álbum (opcional)"
                  value={newTrack.album}
                  onChange={(e) => setNewTrack({ ...newTrack, album: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
                <input
                  data-testid="create-track-duration"
                  type="number"
                  placeholder="Duración (segundos)"
                  value={newTrack.duration}
                  onChange={(e) => setNewTrack({ ...newTrack, duration: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
              <button
                type="submit"
                data-testid="submit-create-track"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4" />
                Añadir Track
              </button>
            </form>
          </div>

          {/* Tracks List */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Historial Reciente</h2>
            <div className="space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  data-testid={`track-item-${track.id}`}
                  className="flex items-center justify-between p-4 bg-[#0F0F13] rounded-xl border border-white/10"
                >
                  <div>
                    <p className="font-bold">{track.title}</p>
                    <p className="text-sm text-[#A1A1AA]">{track.artist}</p>
                  </div>
                  {track.duration && (
                    <span className="text-sm text-[#00E5FF] font-mono">
                      {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Links Tab */}
      {activeTab === 'social' && (
        <div data-testid="social-management" className="glass-effect rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Redes Sociales</h2>
          <p className="text-[#A1A1AA] mb-6">Configura los enlaces a tus redes sociales. Aparecerán en un popup para los visitantes.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input
                type="url"
                placeholder="https://facebook.com/tuPagina"
                value={socialLinks.facebook || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="url"
                placeholder="https://instagram.com/tuCuenta"
                value={socialLinks.instagram || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#E4405F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TikTok</label>
              <input
                type="url"
                placeholder="https://tiktok.com/@tuCuenta"
                value={socialLinks.tiktok || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">YouTube</label>
              <input
                type="url"
                placeholder="https://youtube.com/tuCanal"
                value={socialLinks.youtube || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Twitter/X</label>
              <input
                type="url"
                placeholder="https://twitter.com/tuCuenta"
                value={socialLinks.twitter || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              />
            </div>
            <button
              onClick={handleUpdateSocialLinks}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
            >
              <Save className="w-4 h-4" />
              Guardar Redes Sociales
            </button>
          </div>
        </div>
      )}

      {/* Advertisements Tab */}
      {activeTab === 'ads' && (
        <div data-testid="ads-management" className="space-y-6">
          {/* Create Ad Form */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Crear Nueva Publicidad</h2>
            <form onSubmit={handleCreateAd} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Título del negocio"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL de la imagen"
                    value={newAd.image_url}
                    onChange={(e) => setNewAd({ ...newAd, image_url: e.target.value })}
                    className="flex-1 bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                    readOnly
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-3 bg-[#00E5FF] text-black font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </button>
                </div>
              </div>
              
              {/* Preview de imagen */}
              {newAd.image_url && (
                <div className="relative">
                  <img
                    src={newAd.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setNewAd({ ...newAd, image_url: '' })}
                    className="absolute top-2 right-2 p-1 bg-[#FF003C] rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <textarea
                placeholder="Descripción (opcional)"
                value={newAd.description}
                onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] min-h-[80px]"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="url"
                  placeholder="Link del negocio (opcional)"
                  value={newAd.link_url}
                  onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
                <input
                  type="number"
                  placeholder="Orden (0 = primero)"
                  value={newAd.order}
                  onChange={(e) => setNewAd({ ...newAd, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
              <button
                type="submit"
                disabled={!newAd.image_url || !newAd.title}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFE600] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Crear Publicidad
              </button>
            </form>
          </div>

          {/* Ads List */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Publicidades Actuales ({advertisements.length})</h2>
            <div className="space-y-4">
              {advertisements.map((ad) => (
                <div
                  key={ad.id}
                  className={`flex flex-col sm:flex-row gap-4 p-4 bg-[#0F0F13] rounded-xl border ${ad.is_active ? 'border-[#00E5FF]/50' : 'border-white/10 opacity-60'}`}
                >
                  {ad.image_url && (
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full sm:w-32 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{ad.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${ad.is_active ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-white/10 text-[#A1A1AA]'}`}>
                        {ad.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {ad.description && <p className="text-sm text-[#A1A1AA]">{ad.description}</p>}
                    {ad.link_url && <p className="text-xs text-[#FFE600] truncate">{ad.link_url}</p>}
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => handleToggleAd(ad)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${ad.is_active ? 'bg-white/10 text-white' : 'bg-[#00E5FF]/20 text-[#00E5FF]'}`}
                    >
                      {ad.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 text-[#FF003C] hover:bg-[#FF003C]/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {advertisements.length === 0 && (
                <p className="text-center text-[#A1A1AA] py-8">No hay publicidades. Crea una arriba.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DJ Live Tab */}
      {activeTab === 'djlive' && (
        <DJBroadcast />
      )}
    </div>
  );
};

export default AdminDashboard;