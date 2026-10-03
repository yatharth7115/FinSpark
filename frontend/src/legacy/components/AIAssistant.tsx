import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Volume2, X, MessageCircle, Globe } from 'lucide-react';
import axios from 'axios';

const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  ta: { name: 'Tamil', flag: '🇮🇳' },
  te: { name: 'Telugu', flag: '🇮🇳' },
  kn: { name: 'Kannada', flag: '🇮🇳' },
  bn: { name: 'Bengali', flag: '🇮🇳' },
  gu: { name: 'Gujarati', flag: '🇮🇳' },
  mr: { name: 'Marathi', flag: '🇮🇳' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
};

const GREETINGS: { [key: string]: string } = {
  en: 'Hello! 👋 How may I help you today? I can assist you with navigation, answer questions, and help you explore FinSpark.',
  es: '¡Hola! 👋 ¿Cómo puedo ayudarte hoy? Puedo ayudarte con la navegación y responder preguntas sobre FinSpark.',
  fr: 'Bonjour! 👋 Comment puis-je vous aider? Je peux vous assister dans la navigation et répondre aux questions.',
  de: 'Hallo! 👋 Wie kann ich dir heute helfen? Ich kann dir bei der Navigation und Fragen zu FinSpark helfen.',
  hi: 'नमस्ते! 👋 मैं आपकी आज कैसे मदद कर सकता हूँ? मैं नेविगेशन, सवालों के जवाब दे सकता हूँ, और FinSpark को एक्सप्लोर करने में मदद कर सकता हूँ।',
  ta: 'வணக்கம்! 👋 நான் இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்? நான் நேவிகேஷன் மற்றும் கேள்விகளுக்கு பதிலளிக்க முடியும்.',
  te: 'నమస్కారం! 👋 నేను ఈ రోజు మీకు ఎలా సహాయం చేయగలను? నేను నావిగేషన్ మరియు ప్రశ్నలకు సమాధానం ఇవ్వగలను.',
  kn: 'ಹಲೋ! 👋 ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ನಾವು ನೆವಿಗೇಷನ್ ಮತ್ತು ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.',
  bn: 'হ্যালো! 👋 আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি? আমি নেভিগেশন এবং প্রশ্নের উত্তর দিতে পারি।',
  gu: 'હેલો! 👋 હું આજ તમને કેવી રીતે મદદ કરી શકું છું? હું નેવિગેશન અને પ્રશ્નોનો જવાબ આપી શકું છું.',
  mr: 'नमस्कार! 👋 मैं आज आपकी कैसे मदद कर सकता हूं? मैं नेविगेशन और प्रश्नों का उत्तर दे सकता हूं।',
  ja: 'こんにちは! 👋 今日はどのようにお手伝いできますか? ナビゲーションと質問にお答えできます。',
  zh: '你好! 👋 我今天能如何帮助你? 我可以帮助导航和回答问题。',
  pt: 'Olá! 👋 Como posso ajudar hoje? Posso ajudar com navegação e responder perguntas sobre FinSpark.',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  currentPage?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentPage = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: GREETINGS['en'],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<string>('en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = getLanguageCode(language);

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[0].isFinal) {
          setInput(transcript);
        }
      };
    }
  }, [language]);

  // Update greeting when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: GREETINGS[language] || GREETINGS['en'],
          timestamp: new Date(),
        },
      ]);
    }
  }, [language]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getLanguageCode = (lang: string): string => {
    const codes: { [key: string]: string } = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      mr: 'mr-IN',
      ja: 'ja-JP',
      zh: 'zh-CN',
      pt: 'pt-BR',
    };
    return codes[lang] || 'en-US';
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.lang = getLanguageCode(language);
        recognitionRef.current.start();
      }
    }
  };

  const handleTextToSpeech = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(language);
    utterance.rate = 1;
    utterance.pitch = 1.2;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to backend for AI response
      const response = await axios.post('http://localhost:8001/ai-assistant/', {
        message: input,
        language: language,
        context: currentPage,
        chat_history: messages.slice(-5), // Send last 5 messages for context
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-play response if speech is enabled
      if (response.data.should_speak) {
        handleTextToSpeech(response.data.response);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-96 h-96 bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border-b border-cyan-500/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🙏</span>
                <span className="text-sm font-semibold text-white">FinSpark Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-1.5 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  title="Change language"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Language Menu */}
            {showLanguageMenu && (
              <div className="px-3 py-2 bg-slate-800/50 border-b border-cyan-500/20 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code);
                      setShowLanguageMenu(false);
                    }}
                    className={`py-1 px-1.5 rounded text-xs font-medium transition-colors ${
                      language === code
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    title={name}
                  >
                    {flag} {name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                        : 'bg-slate-700/50 text-slate-100 border border-slate-600/30'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleTextToSpeech(msg.content)}
                        className="mt-1 text-xs hover:text-cyan-400 transition-colors flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        {isSpeaking ? 'Playing...' : 'Listen'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-slate-700/50">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-cyan-500/20 bg-slate-800/50 px-3 py-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-500/30 border border-red-500/50 text-red-400'
                      : 'bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                {LANGUAGES[language as keyof typeof LANGUAGES]?.flag} {LANGUAGES[language as keyof typeof LANGUAGES]?.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-3xl border-2 border-cyan-400/50 hover:border-cyan-300"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <span>🙏</span>}
      </motion.button>
    </div>
  );
};
