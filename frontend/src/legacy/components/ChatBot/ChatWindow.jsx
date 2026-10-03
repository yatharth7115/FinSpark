import { useState, useRef, useEffect } from 'react';
import { generateResponse, SUGGESTED_QUESTIONS } from '../../utils/chatEngine';
import { 
  startListening, 
  stopListening, 
  speak, 
  stopSpeaking, 
  isSpeechRecognitionSupported 
} from '../../utils/voiceService';

export default function ChatWindow({ onClose, currentPage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [interimText, setInterimText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Send greeting on mount
  useEffect(() => {
    const greeting = 'Hi! 👋 I\'m your FinSpark AI assistant. How can I help you today?';
    setMessages([{
      id: Date.now(),
      type: 'bot',
      text: greeting,
      timestamp: new Date()
    }]);
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Send message with page context
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 500 + Math.random() * 1000;
    setTimeout(async () => {
      const response = await generateResponse(text, currentPage);
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: response?.text || 'I\'m sorry, I couldn\'t understand that.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Voice input
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      setInterimText('');
    } else {
      setInterimText('');
      const started = startListening(
        'en-US',
        (text, isFinal) => {
          if (isFinal) {
            setInput(text);
            setInterimText('');
            setIsListening(false);
            // Auto-send after voice input
            setTimeout(() => sendMessage(text), 200);
          } else {
            setInterimText(text);
          }
        },
        () => {
          setIsListening(false);
          setInterimText('');
        },
        (error) => {
          setIsListening(false);
          setInterimText('');
          const errorMsg = {
            id: Date.now(),
            type: 'bot',
            text: `⚠️ ${error}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      );
      if (started) setIsListening(true);
    }
  };

  // Text-to-speech
  const toggleSpeak = (msg) => {
    if (speakingMsgId === msg.id) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msg.id);
      speak(msg.text, 'en-US', () => {
        setSpeakingMsgId(null);
      });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-like rendering
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      let rendered = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '<span class="bullet">•</span> ');
      return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar-small">
            <span className="avatar-emoji-small">🙏</span>
            <span className="online-dot" />
          </div>
          <div className="chat-header-info">
            <h3>FinSpark AI</h3>
            <span className="chat-status">
              {isListening ? '🎙️ Listening...' : '🟢 Online'}
            </span>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose} title="Close (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="msg-avatar">
                <span className="avatar-emoji-small">🙏</span>
              </div>
            )}
            <div className="msg-content">
              <div className="msg-bubble">
                {renderText(msg.text)}
              </div>
              <div className="msg-meta">
                <span className="msg-time">{formatTime(msg.timestamp)}</span>
                {msg.type === 'bot' && (
                  <button 
                    className={`msg-speak-btn ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                    onClick={() => toggleSpeak(msg)}
                    title={speakingMsgId === msg.id ? 'Stop speaking' : 'Read aloud'}
                  >
                    {speakingMsgId === msg.id ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Suggested Questions */}
        {messages.length <= 6 && (
          <div className="chat-message bot">
            <div className="msg-avatar">
              <span className="avatar-emoji-small">🙏</span>
            </div>
            <div className="msg-content">
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>💡 Try asking:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(question.replace(/^[^A-Za-z0-9]+/, '').trim())}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        hover: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' }
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0ea5e9';
                        e.target.style.borderColor = '#0ea5e9';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#1e293b';
                        e.target.style.borderColor = '#334155';
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-message bot">
            <div className="msg-avatar">
              <span className="avatar-emoji-small">🙏</span>
            </div>
            <div className="msg-content">
              <div className="msg-bubble typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {/* Interim voice text */}
        {interimText && (
          <div className="chat-message user interim">
            <div className="msg-content">
              <div className="msg-bubble interim-bubble">
                <p>{interimText}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <button 
          type="button"
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Voice input'}
          disabled={!isSpeechRecognitionSupported()}
        >
          {isListening ? (
            <div className="voice-waves">
              <span /><span /><span /><span /><span />
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Listening...' : 'Type your question...'}
          disabled={isListening}
          autoComplete="off"
        />
        <button 
          type="submit" 
          className="send-btn"
          disabled={!input.trim() || isListening}
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
