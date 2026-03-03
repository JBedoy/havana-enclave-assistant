import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { systemInstruction } from '../systemInstruction';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export function useTextChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<any>(null);

  const initChat = useCallback(() => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatRef.current = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
      
      // Automatically add the initial greeting
      setMessages([{ role: 'model', text: "Hey this is Havana Enclave in sunny Miami! How can I help you today?" }]);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (!chatRef.current) {
      initChat();
    }

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatRef.current.sendMessage({ message: text });
      const modelMessage: Message = { role: 'model', text: response.text || '' };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(err.message || "Failed to send message.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = useCallback(() => {
    chatRef.current = null;
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    initChat,
    resetChat
  };
}
