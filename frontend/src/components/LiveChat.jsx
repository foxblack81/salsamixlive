import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [hasSetUsername, setHasSetUsername] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Load username from localStorage
    const savedUsername = localStorage.getItem('chat_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setHasSetUsername(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && hasSetUsername) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, hasSetUsername]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/chat/messages?limit=50`);
      setMessages(response.data.messages || []);
      setOnlineCount(response.data.online_count || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (username.trim().length >= 2) {
      localStorage.setItem('chat_username', username.trim());
      setHasSetUsername(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${API}/chat/messages`, {
        username: username,
        message: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        data-testid="chat-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#00E5FF] text-black shadow-lg hover:scale-110 transition-transform"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold text-sm hidden sm:inline">CHAT ONLINE!</span>
          </>
        )}
        {!isOpen && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF003C] text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          data-testid="chat-window"
          className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-96 h-[500px] glass-effect border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
              <h3 className="font-bold text-white">Chat en Vivo</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
              <Users className="w-4 h-4" />
              <span>{onlineCount}</span>
            </div>
          </div>

          {!hasSetUsername ? (
            // Username Setup
            <div className="flex-1 flex items-center justify-center p-6">
              <form onSubmit={handleSetUsername} className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-bold text-white mb-2">¡Únete al chat!</h4>
                  <p className="text-sm text-[#A1A1AA]">Elige un nombre para empezar</p>
                </div>
                <input
                  data-testid="chat-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre..."
                  maxLength={20}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  autoFocus
                />
                <button
                  type="submit"
                  data-testid="chat-username-submit"
                  disabled={username.trim().length < 2}
                  className="w-full bg-[#FFE600] text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Entrar al Chat
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-[#A1A1AA] text-sm py-8">
                    No hay mensajes aún. ¡Sé el primero en escribir!
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      data-testid={`chat-message-${index}`}
                      className={`flex flex-col ${
                        msg.username === username ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold text-[#00E5FF]">
                          {msg.username}
                        </span>
                        <span className="text-xs text-[#A1A1AA]">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[80%] break-words ${
                          msg.username === username
                            ? 'bg-[#00E5FF] text-black'
                            : 'bg-[#0F0F13] text-white border border-white/10'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/10"
              >
                <div className="flex gap-2">
                  <input
                    data-testid="chat-message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={200}
                    className="flex-1 bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  />
                  <button
                    type="submit"
                    data-testid="chat-send-button"
                    disabled={!newMessage.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FFE600] text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-2">
                  Chateando como <span className="text-[#00E5FF] font-medium">{username}</span>
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default LiveChat;