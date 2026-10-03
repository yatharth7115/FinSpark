import { useState, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import AvatarButton from './AvatarButton';
import './ChatBot.css';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('Home');

  // Extract current page from URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) setCurrentPage('Dashboard');
    else if (path.includes('/upload')) setCurrentPage('Upload');
    else if (path.includes('/analysis')) setCurrentPage('Analysis');
    else if (path.includes('/mapping')) setCurrentPage('Mapping');
    else if (path.includes('/simulation')) setCurrentPage('Simulation');
    else if (path.includes('/deploy')) setCurrentPage('Deploy');
    else setCurrentPage('Home');
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <div className="chatbot-container">
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          currentPage={currentPage}
        />
      )}
      <AvatarButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}
