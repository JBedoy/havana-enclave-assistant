import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, AudioLines, Building2, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { useLiveAudio } from './hooks/useLiveAudio';
import { useTextChat } from './hooks/useTextChat';
import Markdown from 'react-markdown';

export default function App() {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  
  // Voice Hook
  const { isConnected, isConnecting, isSpeaking, volume, error: voiceError, connect, disconnect } = useLiveAudio();
  
  // Text Hook
  const { messages, isLoading, error: textError, sendMessage, initChat } = useTextChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll text chat
  useEffect(() => {
    if (mode === 'text') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mode]);

  // Initialize text chat when switching to text mode
  useEffect(() => {
    if (mode === 'text' && messages.length === 0) {
      initChat();
    }
  }, [mode, initChat, messages.length]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleModeSwitch = (newMode: 'voice' | 'text') => {
    if (newMode === 'text' && isConnected) {
      disconnect();
    }
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100 flex flex-col" style={{ height: '800px', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="bg-[#f7921e] text-white p-6 text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://havanaenclave.com/wp-content/uploads/2026/02/Orange-Texture.png')] bg-cover bg-center opacity-90"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3 overflow-hidden border-2 border-white/20 shadow-lg">
              <img 
                src="https://havanaenclave.com/wp-content/uploads/2026/02/building.png" 
                alt="Havana Enclave Building Rendering" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <img 
              src="https://havanaenclave.com/wp-content/uploads/2026/02/Havana_EnclaveHorizontal_WhiteLogo_Chat.png" 
              alt="Havana Enclave Logo" 
              className="h-8 mb-1 object-contain drop-shadow-md"
            />
            <p className="text-white/90 text-xs font-medium uppercase tracking-widest">Virtual Assistant</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-stone-100 shrink-0">
          <button 
            onClick={() => handleModeSwitch('voice')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'voice' ? 'text-[#f7921e] border-b-2 border-[#f7921e]' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Mic className="w-4 h-4" /> Voice
          </button>
          <button 
            onClick={() => handleModeSwitch('text')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'text' ? 'text-[#f7921e] border-b-2 border-[#f7921e]' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <MessageSquare className="w-4 h-4" /> Text
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
          
          {/* VOICE MODE */}
          {mode === 'voice' && (
            <div className="p-8 flex flex-col items-center justify-center h-full overflow-y-auto">
              {/* Status Indicator */}
              <div className="h-40 flex items-center justify-center w-full mb-6">
                {isConnecting ? (
                  <div className="flex flex-col items-center text-stone-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="text-sm font-medium">Connecting to Havana Enclave Virtual Assistant...</p>
                  </div>
                ) : isConnected ? (
                  <div className="flex flex-col items-center">
                    <div className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 ${isSpeaking ? 'bg-emerald-100 scale-110' : 'bg-stone-100'}`}>
                      {isSpeaking ? (
                        <AudioLines className="w-10 h-10 text-emerald-600 animate-pulse" />
                      ) : (
                        <Mic className="w-10 h-10 text-stone-600" />
                      )}
                      
                      {/* Ripple effect when speaking */}
                      {isSpeaking && (
                        <>
                          <div className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-50 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                          <div className="absolute inset-[-10px] rounded-full border border-emerald-300 opacity-30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                        </>
                      )}
                    </div>
                    <p className={`mt-6 text-sm font-medium transition-colors duration-300 ${isSpeaking ? 'text-emerald-600' : 'text-stone-500'}`}>
                      {isSpeaking ? 'Assistant is speaking...' : 'Listening...'}
                    </p>

                    {/* Audio Visualizer (User speaking) */}
                    <div className="h-8 mt-3 flex items-center justify-center gap-1.5 transition-opacity duration-300" style={{ opacity: isSpeaking ? 0 : 1 }}>
                      {[0, 1, 2, 3, 4].map((i) => {
                        const multiplier = [0.4, 0.8, 1, 0.8, 0.4][i];
                        const height = Math.max(4, Math.min(32, volume * 80 * multiplier));
                        return (
                          <div
                            key={i}
                            className="w-1.5 bg-[#f7921e] rounded-full transition-all duration-75"
                            style={{ height: `${height}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-stone-400">
                    <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center mb-6 border border-stone-100">
                      <MicOff className="w-10 h-10 text-stone-300" />
                    </div>
                    <p className="text-sm font-medium text-stone-500 text-center max-w-[250px]">
                      Tap to start a conversation about our new Miami condominiums.
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {voiceError && (
                <div className="w-full p-4 mb-6 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 text-center flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-500 mb-1" />
                  <p className="font-semibold text-base">Microphone Access Needed</p>
                  <p>{voiceError}</p>
                </div>
              )}

              {/* Controls */}
              <button
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                  isConnected 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                    : 'bg-[#f7921e] text-white hover:bg-[#e08115] shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                } ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isConnected ? (
                  <>
                    <PhoneOff className="w-5 h-5" />
                    End Conversation
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Allow Mic & Start
                  </>
                )}
              </button>

              {!isConnected && !isConnecting && !voiceError && (
                <p className="mt-4 text-xs text-stone-400 text-center px-4">
                  *You will be prompted to allow microphone access so the assistant can hear you.
                </p>
              )}
            </div>
          )}

          {/* TEXT MODE */}
          {mode === 'text' && (
            <div className="flex flex-col h-full bg-stone-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#f7921e] text-white rounded-br-sm' 
                        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <div className="markdown-body prose prose-sm prose-stone max-w-none prose-a:text-[#f7921e] prose-a:font-semibold">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2 text-stone-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-medium">Assistant is typing...</span>
                    </div>
                  </div>
                )}
                {textError && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100">
                      {textError}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 bg-white border-t border-stone-100">
                <form onSubmit={handleSendText} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7921e]/50 focus:border-[#f7921e] transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="bg-[#f7921e] text-white p-3 rounded-xl hover:bg-[#e08115] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Website Link */}
        <div className="py-4 bg-white border-t border-stone-100 flex justify-center shrink-0">
          <a 
            href="https://www.havanaenclave.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs font-medium text-stone-400 hover:text-[#f7921e] transition-colors"
          >
            www.havanaenclave.com
          </a>
        </div>
        
      </div>
    </div>
  );
}
