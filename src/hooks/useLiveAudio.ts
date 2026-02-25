import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { systemInstruction } from '../systemInstruction';

// Worklet code as a string
const pcmProcessorCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      
      // Append new data to buffer
      const newBuffer = new Float32Array(this.buffer.length + channelData.length);
      newBuffer.set(this.buffer);
      newBuffer.set(channelData, this.buffer.length);
      this.buffer = newBuffer;

      // Process in chunks of 2048 samples
      const chunkSize = 2048;
      while (this.buffer.length >= chunkSize) {
        const chunk = this.buffer.slice(0, chunkSize);
        this.buffer = this.buffer.slice(chunkSize);
        
        // Convert Float32 to Int16
        const int16Array = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const s = Math.max(-1, Math.min(1, chunk[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send to main thread
        this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
`;

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useLiveAudio() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const nextStartTimeRef = useRef<number>(0);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(console.error);
      sessionRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Setup Audio Context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // 2. Load Worklets
      const processorBlob = new Blob([pcmProcessorCode], { type: 'application/javascript' });
      const processorUrl = URL.createObjectURL(processorBlob);
      await audioContext.audioWorklet.addModule(processorUrl);

      // 3. Setup Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);

      // 4. Setup Processor Node (Mic -> API)
      const processorNode = new AudioWorkletNode(audioContext, 'pcm-processor');
      processorNodeRef.current = processorNode;
      source.connect(processorNode);
      processorNode.connect(audioContext.destination); // Required to keep it running

      // 4.5 Setup Analyser for Visualizer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastUpdateTime = 0;
      const updateVolume = (time: number) => {
        if (!analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(updateVolume);

        // Throttle to ~20fps for smooth but performant React updates
        if (time - lastUpdateTime < 50) return;
        lastUpdateTime = time;

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolume(avg / 255); // Normalize to 0-1
      };
      animationFrameRef.current = requestAnimationFrame(updateVolume);

      // 5. Connect to Live API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      aiRef.current = ai;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Trigger the AI to start speaking immediately
            sessionPromise.then((session) => {
              session.send({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [{ text: "Hello! I just connected. Please greet me." }]
                    }
                  ],
                  turnComplete: true
                }
              });
            });
            
            // Start sending audio
            processorNode.port.onmessage = (e) => {
              const int16Array = new Int16Array(e.data);
              const base64Data = arrayBufferToBase64(int16Array.buffer);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              playAudioChunk(base64Audio, audioContext);
            }
            if (message.serverContent?.interrupted) {
              // Handle interruption
              setIsSpeaking(false);
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          },
          onclose: () => {
            setIsConnected(false);
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to microphone or API.");
      setIsConnecting(false);
      disconnect();
    }
  }, [disconnect]);

  const playAudioChunk = (base64Audio: string, context: AudioContext) => {
    try {
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      const int16Array = new Int16Array(arrayBuffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = context.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);

      const currentTime = context.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      
      source.onended = () => {
        if (context.currentTime >= nextStartTimeRef.current - 0.1) {
          setIsSpeaking(false);
        }
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    volume,
    error,
    connect,
    disconnect
  };
}
