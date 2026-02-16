
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { TranscriptItem, Scenario, Persona } from '../types.ts';
import { decode, decodeAudioData, encode } from '../ui/utils.ts';

export type RolePlayStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'analyzing' | 'error';

export const useRolePlaySession = (scenario: Scenario, traineeName: string) => {
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<RolePlayStatus>('idle');
  const [volume, setVolume] = useState(0);
  const [persona, setPersona] = useState<Persona | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; analyser: AnalyserNode } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  const cleanup = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
    }
    status !== 'analyzing' && setStatus('idle');
  }, [status]);

  const startSession = async () => {
    const key = process.env.API_KEY;
    if (!key) return setStatus('error');

    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      const sourceMic = inputCtx.createMediaStreamSource(stream);
      sourceMic.connect(analyser);
      audioContextRef.current = { input: inputCtx, output: outputCtx, analyser };

      const ai = new GoogleGenAI({ apiKey: key });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionRef.current?.sendRealtimeInput({ 
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
              });
            };
            sourceMic.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              const buffer = await decodeAudioData(decode(audio), outputCtx, 24000, 1);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const src = outputCtx.createBufferSource();
              src.buffer = buffer; src.connect(outputCtx.destination);
              src.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(src);
              src.onended = () => activeSourcesRef.current.delete(src);
            }
            if (msg.serverContent?.inputTranscription) inputBuffer.current += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription) outputBuffer.current += msg.serverContent.outputTranscription.text;
            if (msg.serverContent?.turnComplete) {
              // FIX: Compatibility with TranscriptItem[] state
              setMessages(prev => [
                ...prev, 
                { speaker: 'user', text: inputBuffer.current },
                { speaker: 'model', text: outputBuffer.current }
              ].filter(m => m.text.trim()));
              inputBuffer.current = ''; outputBuffer.current = '';
            }
            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
            }
          },
          onerror: () => setStatus('error')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, outputAudioTranscription: {},
          systemInstruction: `あなたは携帯電話会社の顧客です。状況: ${scenario.initialInquiry}。日本語で自然に答えてください。`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setStatus('error'); }
  };

  useEffect(() => {
    const ages = ['20代', '30代', '40代', '50代', '60代'];
    const personalities = ['穏やか', '性急', '論理的'];
    setPersona({ ageGroup: ages[Math.floor(Math.random()*ages.length)], personality: personalities[Math.floor(Math.random()*personalities.length)], knowledgeLevel: '一般的' });
    setStatus('ringing');
    return cleanup;
  }, [cleanup]);

  return { messages, status, volume, persona, startSession, cleanup, setStatus };
};
