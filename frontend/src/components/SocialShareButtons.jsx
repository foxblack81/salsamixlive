import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X,
  Send,
  MessageCircle
} from 'lucide-react';

// Custom SVG icons for social media (lucide-react doesn't have these)
const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SocialShareButtons = ({ 
  url = window.location.href, 
  title = 'SalsaMixLive - La mejor salsa colombiana 24/7',
  description = 'Escucha la mejor salsa colombiana en vivo las 24 horas. ¡Música que alegra el alma!'
}) => {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);
  
  const shareLinks = [
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      color: 'bg-[#1877F2] hover:bg-[#1877F2]/80'
    },
    {
      name: 'Twitter',
      icon: <TwitterIcon />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/80'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-[#25D366] hover:bg-[#25D366]/80'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#0088CC] hover:bg-[#0088CC]/80'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShare(true);
        }
      }
    } else {
      setShowShare(true);
    }
  };

  const handleShareClick = (shareUrl) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  return (
    <>
      {/* Share Button */}
      <button
        data-testid="share-button"
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600]/30 rounded-xl hover:bg-[#FFE600]/30 transition-all"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Compartir</span>
      </button>

      {/* Share Modal */}
      {showShare && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowShare(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            data-testid="share-modal"
            className="relative glass-effect rounded-2xl p-6 w-full max-w-sm border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowShare(false)}
              className="absolute top-4 right-4 p-2 text-[#A1A1AA] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 text-center">
              Compartir Radio
            </h3>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {shareLinks.map((social) => (
                <button
                  key={social.name}
                  data-testid={`share-${social.name.toLowerCase()}`}
                  onClick={() => handleShareClick(social.url)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all ${social.color}`}
                >
                  {social.icon}
                  <span>{social.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#A1A1AA] truncate"
              />
              <button
                data-testid="copy-link-button"
                onClick={handleCopyLink}
                className={`p-3 rounded-xl transition-all ${
                  copied 
                    ? 'bg-[#00E5FF] text-black' 
                    : 'bg-[#0F0F13] border border-white/10 text-white hover:border-white/30'
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
            {copied && (
              <p className="text-center text-sm text-[#00E5FF] mt-2">
                ¡Link copiado!
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShareButtons;
