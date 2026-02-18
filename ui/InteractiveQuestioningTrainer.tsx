
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ArrowLeftIcon, PhoneIcon, PhoneDownIcon, MicIcon, SparklesIcon, LoadingIcon, InformationCircleIcon } from './Icons.tsx';
import { Center, TranscriptItem } from '../types.ts';
import { decode, decodeAudioData, encode } from './utils.ts';

interface Props {
  onBack: () => void;
  traineeName: string;
  center: Center | null;
  apiKey: string | null;
  adminToken: string | null;
}

type SessionStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'analyzing';

const InteractiveQuestioningTrainer: React.FC<Props> = ({ onBack, traineeName }) => {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [topic, setTopic] = useState('契約内容への漠然とした不安');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; analyser: AnalyserNode } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  const cleanup = () => {
    if (sessionRef.current) sessionRef.current.close();
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
    }
  };

  const startSession = async () => {
    const key = process.env.API_KEY;
    if (!key) return;

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
              // FIX: TranscriptItem role compatibility
              setMessages(prev => [
                ...prev, 
                { speaker: 'user', text: inputBuffer.current },
                { speaker: 'model', text: outputBuffer.current }
              ].filter(m => m.text.trim()));
              inputBuffer.current = ''; outputBuffer.current = '';
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, outputAudioTranscription: {},
          systemInstruction: `あなたは「質問力トレーニング」の顧客役です。
            状況: ${topic}
            ## 振る舞い
            - あなたは何か困っていますが、自分からは状況をうまく説明できません。
            - 研修生が具体的な質問（いつから？何をしている時？など）をしない限り、曖昧な返答（「なんか調子が悪くて」「困ってるんです」等）に留めてください。
            - 研修生が「オープン質問」を使って具体化させようとした時だけ、状況を少しずつ開示してください。`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setStatus('idle'); alert("接続エラーが発生しました。"); }
  };

  useEffect(() => {
    setStatus('ringing');
    return cleanup;
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <div className="flex flex-row items-center">
            <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all whitespace-nowrap group px-2">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                <span className="leading-none">← 戻る</span>
            </button>
        </div>

        <div className="bg-[#020617] rounded-[3rem] h-[78vh] flex flex-col border border-slate-800 shadow-3xl overflow-hidden relative">
            <div className="p-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/30">
                        <SparklesIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tighter leading-none">対話戦略トレーニング</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">Voice Link System</p>
                    </div>
                </div>
                {status === 'connected' && (
                    <button onClick={() => { cleanup(); onBack(); }} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 transform active:scale-95">
                        <PhoneDownIcon className="h-4 w-4" /> <span>終了</span>
                    </button>
                )}
            </div>

            <div className="flex-1 relative overflow-hidden flex">
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {status === 'ringing' && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
                            <div className="w-24 h-24 bg-slate-900 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                <PhoneIcon className="h-12 w-12 text-emerald-400 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter mb-2">トレーニング顧客からの入電</h3>
                            <button onClick={startSession} className="mt-10 bg-emerald-600 hover:bg-emerald-500 text-white px-14 py-5 rounded-[2.5rem] shadow-2xl text-xl font-black tracking-widest active:scale-95 transition-all">受電して開始</button>
                        </div>
                    )}
                    {status === 'connecting' && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 animate-fade-in">
                            <LoadingIcon className="h-12 w-12 text-sky-500 mb-4" />
                            <p className="font-black text-sky-400 text-sm tracking-widest uppercase">Connecting to AI Client...</p>
                        </div>
                    )}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-slate-950/30">
                        {messages.length === 0 && status === 'connected' && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                <MicIcon className="h-32 w-32 text-white" />
                                <p className="font-black text-lg uppercase tracking-[0.4em] mt-4">Monitoring Audio</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.speaker === 'user' ? traineeName : 'CUSTOMER'}</span>
                                <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-[14px] font-bold leading-relaxed shadow-xl ${m.speaker === 'user' ? 'bg-sky-800 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
export default InteractiveQuestioningTrainer;
