import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, AudioLines, Building2 } from 'lucide-react';
import { useLiveAudio } from './hooks/useLiveAudio';

export default function App() {
  const { isConnected, isConnecting, isSpeaking, error, connect, disconnect } = useLiveAudio();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
        
        {/* Header */}
        <div className="bg-[#f7921e] text-white p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://havanaenclave.com/wp-content/uploads/2026/02/Orange-Texture.png')] bg-cover bg-center opacity-90"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 border-white/20 shadow-lg">
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
              className="h-10 mb-2 object-contain drop-shadow-md"
            />
            <p className="text-white/90 text-sm font-medium uppercase tracking-widest">Virtual Assistant</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 flex flex-col items-center">
          
          {/* Status Indicator */}
          <div className="h-32 flex items-center justify-center w-full mb-8">
            {isConnecting ? (
              <div className="flex flex-col items-center text-stone-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-sm font-medium">Connecting to Eyvis's Office...</p>
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
          {error && (
            <div className="w-full p-4 mb-6 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 text-center">
              {error}
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
                Start Conversation
              </>
            )}
          </button>
          
        </div>
        
      </div>
    </div>
  );
}
