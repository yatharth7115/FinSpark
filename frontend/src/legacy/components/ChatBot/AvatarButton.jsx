import { useState, useEffect } from 'react';

export default function AvatarButton({ isOpen, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Show tooltip after 2 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
        setHasAnimated(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide tooltip when chat opens
  useEffect(() => {
    if (isOpen) setShowTooltip(false);
  }, [isOpen]);

  return (
    <div className="avatar-button-wrapper">
      {/* Greeting tooltip */}
      {showTooltip && !isOpen && (
        <div className="avatar-tooltip" onClick={onClick}>
          <div className="tooltip-content">
            <span className="tooltip-wave">👋</span>
            <span>How may I help you today?</span>
          </div>
          <button 
            className="tooltip-close"
            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
          >
            ×
          </button>
        </div>
      )}

      {/* Floating avatar button */}
      <button 
        className={`avatar-button ${isOpen ? 'open' : ''} ${!hasAnimated ? 'entrance' : ''}`}
        onClick={onClick}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
      >
        {isOpen ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span className="avatar-emoji">🙏</span>
        )}
        <div className="avatar-pulse" />
        <div className="avatar-pulse delay" />
      </button>
    </div>
  );
}
