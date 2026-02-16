
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Scenario, TranscriptItem, Center } from '../types.ts';
import { MicIcon, LoadingIcon, ArrowLeftIcon, PhoneDownIcon, SparklesIcon, PhoneIcon, InformationCircleIcon } from './Icons.tsx';
import { decode, decodeAudioData, encode } from './utils.ts';

interface RolePlayScreenProps {
  scenario: Scenario;
  traineeName: string;
  center: Center | null;
  apiKey: string | null;
  onBack: () => void;
  onComplete: (transcript: TranscriptItem[], scenario: Scenario, persona: any) => void;
  isAnalyzing: boolean;
}

type ConnectionState = 'idle' | 'ringing' | 'connecting' | 'connected';

const RolePlayScreen: React.FC<RolePlayScreenProps> = ({
  scenario,
  traineeName,
  center,
  apiKey,
  onBack,
  onComplete,
  isAnalyzing
}) => {
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [connState, setConnState] = useState<ConnectionState>('idle');
  const [persona, setPersona] = useState<any>(null);
  const [volume, setVolume] = useState<number>(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; analyser: AnalyserNode } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const ringtoneTimerRef = useRef<number | null>(null);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);

  const currentInputBuffer = useRef('');
  const currentOutputBuffer = useRef('');

  // 1. ペルソナの完全ランダム初期化（画面には表示しない）
  useEffect(() => {
    const ages = ['20代', '30代', '40代', '50代', '60代'];
    const personalities = ['穏やか', '性急', '心配性', '論理的', '感情的'];
    const knowledge = ['初心者', '一般的', '詳しい'];
    const genders = ['男性', '女性'];
    
    const newPersona = {
        ageGroup: ages[Math.floor(Math.random() * ages.length)],
        personality: personalities[Math.floor(Math.random() * personalities.length)],
        knowledgeLevel: knowledge[Math.floor(Math.random() * knowledge.length)],
        gender: genders[Math.floor(Math.random() * genders.length)]
    };
    setPersona(newPersona);
    
    // シナリオ読み込み後、呼び出し状態へ
    setConnState('ringing');
    startRingtone();

    return () => cleanup();
  }, []);

  const startRingtone = useCallback(() => {
    if (ringtoneCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    ringtoneCtxRef.current = ctx;

    const playTone = () => {
        if (!ringtoneCtxRef.current) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 400; 
        osc2.frequency.value = 15;
        const modGain = ctx.createGain();
        modGain.gain.value = 10;
        osc2.connect(modGain); 
        modGain.connect(osc1.frequency);
        osc1.connect(gain); 
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
        osc1.start(); 
        osc2.start(); 
        osc1.stop(ctx.currentTime + 2); 
        osc2.stop(ctx.currentTime + 2);
    };
    playTone();
    ringtoneTimerRef.current = window.setInterval(playTone, 3000);
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneTimerRef.current) {
        clearInterval(ringtoneTimerRef.current);
        ringtoneTimerRef.current = null;
    }
    if (ringtoneCtxRef.current) {
        ringtoneCtxRef.current.close();
        ringtoneCtxRef.current = null;
    }
  }, []);

  const cleanup = () => {
    stopRingtone();
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSourcesRef.current.clear();
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
  };

  const updateVolume = () => {
    if (!audioContextRef.current) return;
    const array = new Uint8Array(audioContextRef.current.analyser.frequencyBinCount);
    audioContextRef.current.analyser.getByteFrequencyData(array);
    let sum = 0;
    for (let i = 0; i < array.length; i++) sum += array[i];
    const average = sum / array.length;
    setVolume(average);
    rafIdRef.current = requestAnimationFrame(updateVolume);
  };

  const getSystemInstruction = () => `
    あなたは携帯電話会社のコールセンターに電話をかけてきた顧客です。
    ペルソナ: ${persona?.ageGroup || '40代'} / ${persona?.personality || '穏やか'} / 知識:${persona?.knowledgeLevel || '一般的'} / 性別:${persona?.gender || '不明'}
    契約状況: スマホ:${scenario.smartphonePlan}, 光:${scenario.lightPlan}
    問い合わせ内容: ${scenario.initialInquiry}
    
    ## 指示
    - 常に日本語で、顧客として自然な話し言葉で応対してください。
    - 相手が受電した直後に、あなたから用件を切り出してください。
    - 回答は簡潔すぎず、実際の顧客のように状況を説明してください。
  `;

  const handleAnswerCall = async () => {
    stopRingtone();
    setConnState('connecting');
    await startLiveSession();
  };

  const startLiveSession = async () => {
    const key = process.env.API_KEY;
    if (!key) return;
    
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
            setConnState('connected');
            updateVolume();
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            sourceMic.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }

            if (msg.serverContent?.inputTranscription) {
              currentInputBuffer.current += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.outputTranscription) {
              currentOutputBuffer.current += msg.serverContent.outputTranscription.text;
            }

            if (msg.serverContent?.turnComplete) {
              const userText = currentInputBuffer.current.trim();
              const modelText = currentOutputBuffer.current.trim();
              if (userText || modelText) {
                setMessages(prev => {
                  const updated = [...prev];
                  if (userText) updated.push({ speaker: 'user', text: userText });
                  if (modelText) updated.push({ speaker: 'model', text: modelText });
                  return updated;
                });
              }
              currentInputBuffer.current = '';
              currentOutputBuffer.current = '';
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
              setConnState('idle');
              if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
          },
          onerror: (e) => console.error("Live API Error:", e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: getSystemInstruction()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      alert("接続に失敗しました。マイクの使用を許可してください。");
      onBack();
    }
  };

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-[85vh] bg-[#020617] rounded-[3.5rem] shadow-3xl overflow-hidden animate-fade-in border border-slate-800 text-slate-100 relative">
      
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 sm:p-8 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50 relative z-20">
        <div className="flex-1 space-y-1.5">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-[11px] font-black text-slate-500 hover:text-sky-400 transition-all cursor-pointer group tracking-widest mb-1"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>中断して戻る</span>
          </button>
          <div className="flex items-center gap-5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">{scenario.name}</h2>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-2.5 transition-all duration-500 ${connState === 'connected' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
               <span className={`w-2 h-2 rounded-full ${connState === 'connected' ? 'bg-emerald-500 animate-pulse' : (connState === 'ringing' ? 'bg-rose-500 animate-bounce' : 'bg-slate-700')}`}></span>
               {connState === 'connected' ? '通話中' : (connState === 'ringing' ? '入電あり' : '待機中')}
            </div>
          </div>
        </div>
        
        {connState === 'connected' && (
          <div className="flex items-center gap-4 animate-fade-in">
            <button 
              onClick={() => onComplete(messages, scenario, persona)} 
              disabled={isAnalyzing || messages.length < 1} 
              className="bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 px-8 rounded-2xl shadow-2xl transition-all transform active:scale-95 flex items-center gap-3 disabled:bg-slate-900 disabled:text-slate-700 cursor-pointer"
            >
              {isAnalyzing ? (
                <><LoadingIcon className="h-5 w-5" /><span className="text-sm font-black">評価中...</span></>
              ) : (
                <><PhoneDownIcon className="h-5 w-5" /> <span className="text-sm font-black">通話を終了してAI採点へ</span></>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* メインエリア：状態に応じた表示の切り替え */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-slate-950/40">
          
          {/* 1. 受電待ち（ringing）画面 */}
          {connState === 'ringing' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-fade-in">
              <div className="relative mb-12">
                  <div className="absolute inset-0 bg-sky-500/20 blur-3xl animate-pulse scale-150"></div>
                  <div className="w-32 h-32 bg-slate-900 border-2 border-sky-500/50 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(14,165,233,0.3)]">
                      <PhoneIcon className="h-16 w-16 text-sky-400 animate-bounce" />
                  </div>
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-4">お客様から入電しています</h3>
              <p className="text-slate-400 font-bold text-lg mb-12">受電ボタンを押して、最初のご挨拶から始めてください。</p>
              
              <button 
                onClick={handleAnswerCall}
                className="group flex flex-col items-center gap-4 bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-8 rounded-[3rem] transition-all transform active:scale-90 shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
              >
                 <PhoneIcon className="h-12 w-12 group-hover:scale-110 transition-transform" />
                 <span className="text-2xl font-black tracking-widest">受電する</span>
              </button>
            </div>
          )}

          {/* 2. 接続中（connecting） */}
          {connState === 'connecting' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 animate-fade-in">
                <LoadingIcon className="h-16 w-16 text-sky-500 mb-6" />
                <p className="text-xl font-black tracking-widest text-sky-400">回線を接続しています...</p>
            </div>
          )}

          {/* 3. 通話中（connected） */}
          {connState === 'connected' && (
            <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 animate-pulse">
                  <SparklesIcon className="h-40 w-40 text-sky-400" />
                  <p className="text-3xl font-black mt-8 tracking-tighter italic">音声モニター接続中...</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.speaker === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                  <div className={`flex items-center gap-3 mb-3 ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black ${msg.speaker === 'user' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {msg.speaker === 'user' ? 'あなた' : '顧客'}
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{msg.speaker === 'user' ? traineeName : 'CUSTOMER'}</span>
                  </div>
                  <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-lg font-bold leading-relaxed shadow-2xl ${msg.speaker === 'user' ? 'bg-sky-800 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* サイド情報パネル（属性情報を削除し、モニターに特化） */}
        <div className="hidden lg:flex w-80 border-l border-slate-800/50 flex-col bg-slate-950/60 p-8 space-y-12 overflow-y-auto custom-scrollbar relative z-10">
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">マイク感度</p>
            
            <div className="flex items-end gap-1.5 h-12 w-full justify-center mb-10">
              {[...Array(12)].map((_, i) => {
                const h = connState === 'connected' ? Math.max(15, Math.min(100, volume * (0.3 + Math.random() * 2))) : 15;
                return (
                  <div key={i} className={`w-1.5 rounded-full transition-all duration-75 ${connState === 'connected' ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-800'}`} style={{ height: `${h}%` }}></div>
                );
              })}
            </div>

            <div className="relative">
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${connState === 'connected' ? 'bg-sky-500/20 blur-2xl scale-150' : ''}`}></div>
              <div className={`p-7 rounded-full border-2 transition-all duration-500 relative z-10 ${connState === 'connected' ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_40px_rgba(14,165,233,0.4)]' : 'border-slate-800 opacity-20'}`}>
                <MicIcon className={`h-8 w-8 ${connState === 'connected' ? 'text-sky-400' : 'text-slate-700'}`} />
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800/50 space-y-6">
             <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                    <InformationCircleIcon className="h-3.5 w-3.5" />
                    シナリオの状況
                </p>
                <p className="text-[13px] font-bold text-slate-400 leading-relaxed italic">
                    「{scenario.initialInquiry}」
                </p>
             </div>

             <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">トレーニングアドバイス</p>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                   電話がつながるまで相手の情報はわかりません。名乗りの後の第一声を聞き逃さないよう集中しましょう。
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePlayScreen;
