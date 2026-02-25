import React, { useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, AudioLines, Building2, Download } from 'lucide-react';
import { useLiveAudio } from './hooks/useLiveAudio';
import JSZip from 'jszip';

// Import raw file contents for the zip download
import packageJson from '../package.json?raw';
import viteConfig from '../vite.config.ts?raw';
import indexHtml from '../index.html?raw';
import mainTsx from './main.tsx?raw';
import appTsx from './App.tsx?raw';
import indexCss from './index.css?raw';
import systemInstructionTs from './systemInstruction.ts?raw';
import useLiveAudioTs from './hooks/useLiveAudio.ts?raw';
import tsconfigJson from '../tsconfig.json?raw';
import gitignore from '../.gitignore?raw';

export default function App() {
  const { isConnected, isConnecting, isSpeaking, error, connect, disconnect } = useLiveAudio();
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add root files
      zip.file('package.json', packageJson);
      zip.file('vite.config.ts', viteConfig);
      zip.file('index.html', indexHtml);
      zip.file('tsconfig.json', tsconfigJson);
      zip.file('.gitignore', gitignore);
      zip.file('.env.example', 'GEMINI_API_KEY=your_api_key_here\n');
      
      // Add src files
      zip.folder('src');
      zip.file('src/main.tsx', mainTsx);
      zip.file('src/App.tsx', appTsx);
      zip.file('src/index.css', indexCss);
      zip.file('src/systemInstruction.ts', systemInstructionTs);
      
      // Add hooks
      zip.folder('src/hooks');
      zip.file('src/hooks/useLiveAudio.ts', useLiveAudioTs);

      // Generate the zip file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'havana-enclave-app.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate zip', err);
      alert('Failed to generate zip file. Please try again.');
    } finally {
      setIsZipping(false);
    }
  };

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
          
          {/* Download Source Code Link */}
          <button 
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="mt-6 text-xs text-stone-400 hover:text-[#f7921e] transition-colors underline underline-offset-2 flex items-center justify-center gap-1"
          >
            {isZipping ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {isZipping ? 'Bundling Source Code...' : 'Download Source Code (.zip)'}
          </button>
          
        </div>
        
      </div>
    </div>
  );
}
