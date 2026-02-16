
import { useState, useEffect, useCallback, useRef } from 'react';
import { OneOnOneSession, TranscriptItem } from '../types.ts';
import { apiClient } from '../apiClient.ts';

export const useOneOnOne = (traineeName: string) => {
  const [session, setSession] = useState<OneOnOneSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || recognitionRef.current) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ja-JP';
    recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript;
      // FIX: Use 'user' role for transcript compatibility
      if (text.trim()) setTranscript(prev => [...prev, { speaker: 'user', text: text.trim() }]);
    };
    recognition.onend = () => { if (isListening) recognition.start(); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const poll = useCallback(async () => {
    // FIX: Calling pollCall which now exists in apiClient
    const res = await apiClient.pollCall(traineeName);
    if (res.data) {
      const newSession = res.data;
      setSession(newSession);
      if (newSession.status === 'connected') {
        if (!isListening) startRecognition();
        if (transcript.length > newSession.transcript.length) {
          // FIX: Calling syncTranscript which now exists in apiClient
          apiClient.syncTranscript(newSession.sessionId, transcript);
        } else {
          setTranscript(newSession.transcript);
        }
      }
    } else {
      if (session) {
        setSession(null);
        setTranscript([]);
        stopRecognition();
      }
    }
  }, [traineeName, isListening, session, transcript, startRecognition, stopRecognition]);

  useEffect(() => {
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [poll]);

  return { session, transcript, isListening, startRecognition, stopRecognition };
};
