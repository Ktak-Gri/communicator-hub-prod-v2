import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { TranscriptItem, Scenario } from '../types.ts';
import { decode, decodeAudioData, encode } from '../ui/utils.ts';

export type RolePlayStatus =
  | 'idle'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'error';

export const useRolePlaySession = (
  scenario: Scenario,
  traineeName: string
) => {
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<RolePlayStatus>('idle');

  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const nextStartTimeRef = useRef(0);
  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch {}
      sessionRef.current = null;
    }

    setStatus('idle');
  }, []);

  const startSession = async () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
      setStatus('error');
      return;
    }

    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const outputCtx = new AudioContext({ sampleRate: 24000 });
      await outputCtx.resume();

      const ai = new GoogleGenAI({ apiKey: key });

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-exp',

        callbacks: {
          onopen: () => {
            console.log('🟢 SESSION OPEN');
            setStatus('connected');
          },

          onmessage: async (msg: LiveServerMessage) => {
            const audio =
              msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

            if (audio) {
              const buffer = await decodeAudioData(
                decode(audio),
                outputCtx,
                24000,
                1
              );

              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime
              );

              const src = outputCtx.createBufferSource();
              src.buffer = buffer;
              src.connect(outputCtx.destination);
              src.start(nextStartTimeRef.current);

              nextStartTimeRef.current += buffer.duration;
            }

            if (msg.serverContent?.inputTranscription) {
              inputBuffer.current += msg.serverContent.inputTranscription.text;
            }

            if (msg.serverContent?.outputTranscription) {
              outputBuffer.current += msg.serverContent.outputTranscription.text;
            }

            if (msg.serverContent?.turnComplete) {
              setMessages(prev => [
                ...prev,
                { speaker: 'user', text: inputBuffer.current },
                { speaker: 'model', text: outputBuffer.current }
              ]);

              inputBuffer.current = '';
              outputBuffer.current = '';
            }
          },

          onclose: (event: CloseEvent) => {
            console.log('🔴 CLOSE:', event.code, event.reason);
            cleanup();
          },

          onerror: (err: any) => {
            console.error('🔴 LIVE ERROR:', err);
            setStatus('error');
          }
        },

        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `あなたはドコモの顧客です。状況: ${scenario.initialInquiry}。丁寧な日本語で対話してください。`
        }
      });

      sessionRef.current = session;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (!sessionRef.current) return;

        const arrayBuffer = await event.data.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        sessionRef.current.sendRealtimeInput({
          media: {
            data: encode(uint8),
            mimeType: 'audio/webm'
          }
        });
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;

    } catch (e) {
      console.error('🔴 START ERROR:', e);
      setStatus('error');
    }
  };

  useEffect(() => {
    setStatus('ringing');
    return cleanup;
  }, []);

  return { messages, status, startSession, cleanup };
};