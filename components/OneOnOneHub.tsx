
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Trainee, Scenario, OneOnOneSession, TranscriptItem, Center } from '../types.ts';
import { requestWithJsonp } from '../api.ts';
import { PhoneDownIcon, LoadingIcon, MicIcon, PlayIcon, UserCircleIcon, CheckCircleIcon, PhoneIcon, PencilIcon, InformationCircleIcon } from './Icons.tsx';

interface OneOnOneHubProps {
  traineeName: string;
  trainees: Trainee[];
  currentCenter: Center | null;
  onComplete: (transcript: TranscriptItem[], scenario: Scenario, persona: any) => void;
  isAnalyzing: boolean;
}

const OneOnOneHub: React.FC<OneOnOneHubProps> = ({ traineeName, trainees, currentCenter, onComplete, isAnalyzing }) => {
  const [session, setSession] = useState<OneOnOneSession | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<string>('');
  const [practiceTopic, setPracticeTopic] = useState<string>('');
  const [isCalling, setIsCalling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const pollingRef = useRef<number | null>(null);
  const ringtoneTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeTrainees = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const myNameNormalized = (traineeName || "").trim().toLowerCase();
    
    return trainees
      .map(t => {
          const raw = t as any;
          const name = String(raw["研修生名"] || raw["研修生"] || raw.traineeName || raw.trainee || raw.name || "").trim();
          const centerName = String(raw["センター"] || raw.center || "").trim();
          const endDateRaw = raw["研修終了日"] || raw.endDate;
          const isActiveRaw = raw["有効"] || raw.isActive;
          
          return {
              name,
              center: centerName,
              endDate: endDateRaw,
              isActive: isActiveRaw === true || String(isActiveRaw).toUpperCase() === "TRUE"
          };
      })
      .filter(t => {
        if (!t.name || t.name.toLowerCase() === myNameNormalized) return false;
        if (t.isActive) return true;
        if (t.endDate === null || t.endDate === undefined || String(t.endDate).trim() === "") return true;
        try {
            const end = new Date(t.endDate);
            if (isNaN(end.getTime())) return true;
            const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            return endDateOnly >= today;
        } catch (e) { return true; }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [trainees, traineeName]);

  const playJapaneseRingtone = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const playTone = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 400; osc2.frequency.value = 15;
        const modGain = ctx.createGain();
        modGain.gain.value = 10;
        osc2.connect(modGain); modGain.connect(osc1.frequency);
        osc1.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
        osc1.start(); osc2.start(); osc1.stop(ctx.currentTime + 2); osc2.stop(ctx.currentTime + 2);
    };
    playTone();
    ringtoneTimerRef.current = window.setInterval(playTone, 3000);
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneTimerRef.current) { clearInterval(ringtoneTimerRef.current); ringtoneTimerRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ja-JP';
      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        // FIX: Using 'user' for local trainee role in transcript
        if (text.trim()) setTranscript(prev => [...prev, { speaker: 'user', text: text.trim() }]);
      };
      recognitionRef.current.onend = () => { if (isListening) recognitionRef.current.start(); };
    }
    return () => stopRingtone();
  }, [traineeName, isListening, stopRingtone]);

  const poll = useCallback(async () => {
    try {
      const res = await requestWithJsonp('pollCall', { traineeName });
      if (res.data) {
        const newSession: OneOnOneSession = res.data;
        const prevStatus = session?.status;
        setSession(newSession);
        if (newSession.status === 'calling' && newSession.receiver === traineeName) playJapaneseRingtone();
        else if (newSession.status === 'connected') {
            stopRingtone();
            if (transcript.length > newSession.transcript.length) requestWithJsonp('syncTranscript', { sessionId: newSession.sessionId, transcript });
            else if (newSession.transcript.length > transcript.length) setTranscript(newSession.transcript);
            if (prevStatus !== 'connected' && !isListening) { recognitionRef.current?.start(); setIsListening(true); }
        }
      } else if (session) { setSession(null); setTranscript([]); stopRingtone(); recognitionRef.current?.stop(); setIsListening(false); }
    } catch (e) {}
  }, [traineeName, transcript, session, isListening, playJapaneseRingtone, stopRingtone]);

  useEffect(() => {
    pollingRef.current = window.setInterval(poll, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [poll]);

  const handleCall = async () => {
    if (!selectedTrainee) return;
    setIsCalling(true);
    await requestWithJsonp('initiateCall', { caller: traineeName, receiver: selectedTrainee, scenarioId: `TOPIC:${practiceTopic || '総合対話練習'}` });
    setIsCalling(false);
  };

  const handleAnswer = async () => {
    if (session) {
        stopRingtone();
        await requestWithJsonp('syncTranscript', { sessionId: session.sessionId, transcript: [], status: 'connected' });
        setIsListening(true);
        recognitionRef.current?.start();
    }
  };

  const handleHangUp = async () => {
    if (session) {
        const finalTranscript = [...transcript];
        const topic = session.scenarioId.replace('TOPIC:', '');
        await requestWithJsonp('endCall', { sessionId: session.sessionId });
        recognitionRef.current?.stop(); setIsListening(false); stopRingtone();
        if (session.receiver === traineeName) {
            // FIX: Added internalId, difficulty and personality to match Scenario type
            const dummyScenario: Scenario = { 
                id: '1on1', 
                internalId: '1on1-internal',
                name: topic, 
                initialInquiry: topic, 
                center: '1on1', 
                smartphonePlan: '-', 
                lightPlan: '-',
                difficulty: 3,
                personality: '一般的'
            };
            onComplete(finalTranscript, dummyScenario, { personality: '実在', ageGroup: '実在', knowledgeLevel: '実在' });
        } else alert("通話を終了しました。");
        setSession(null); setTranscript([]);
    }
  };

  if (session && session.status !== 'ended') {
    const isCaller = session.caller === traineeName;
    const partner = isCaller ? session.receiver : session.caller;
    const topic = session.scenarioId.replace('TOPIC:', '');
    return (
      <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 text-white min-h-[520px] flex flex-col items-center animate-fade-in border-2 border-slate-800 max-w-md mx-auto">
        <div className="flex-1 w-full flex flex-col items-center justify-center">
            <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-full bg-sky-500/10 flex items-center justify-center border-2 ${session.status === 'calling' ? 'border-sky-500 animate-pulse' : 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}>
                    <UserCircleIcon className={`w-14 h-14 ${session.status === 'calling' ? 'text-sky-400' : 'text-emerald-400'}`} />
                </div>
            </div>
            <h2 className="text-xl font-black mb-4">{partner} <span className="text-xs font-normal text-slate-400">さん</span></h2>
            <div className="w-full bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 mb-4 text-xs">
                <div className="font-bold text-sky-400 mb-1.5">【テーマ：{topic}】</div>
                <p className="text-slate-300 leading-relaxed">{isCaller ? '顧客役：お手元の資料に基づき発話してください。' : 'オペレーター：エクセルに従い丁寧に応対してください。'}</p>
            </div>
            <div className="w-full flex-1 overflow-y-auto space-y-3 px-1 mb-4 custom-scrollbar min-h-[100px]">
                {transcript.map((item, i) => (
                    <div key={i} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl text-xs max-w-[90%] shadow-sm ${item.speaker === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-100 rounded-tl-none'}`}>
                            {item.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="w-full flex justify-center gap-8 py-4 border-t border-slate-800">
            {session.status === 'calling' && session.receiver === traineeName ? (
                <button onClick={handleAnswer} className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transform active:scale-90 transition-all"><PhoneIcon className="w-7 h-7 text-white" /></button>
            ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isListening ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]' : 'bg-slate-700 opacity-50'}`}><MicIcon className="w-7 h-7 text-white" /></div>
            )}
            <button onClick={handleHangUp} className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transform active:scale-90 transition-all"><PhoneDownIcon className="w-7 h-7 text-white" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200 max-w-2xl mx-auto">
        <div className="bg-slate-900 p-5 text-white relative">
            <h2 className="text-lg font-black flex items-center gap-2 tracking-tight">
                <PlayIcon className="w-5 h-5 text-emerald-400" />
                1 on 1 <span className="text-sky-400">Direct Roleplay</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold leading-tight mt-1 uppercase tracking-wider">全センターから呼び出し相手を選択可能です</p>
        </div>
        
        <div className="p-5 space-y-6 bg-slate-50/50">
            <div className="space-y-3">
                <label className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    <span className="flex items-center gap-1.5">通話相手を選択</span>
                    <span className="text-slate-300">ACTIVE USERS: {activeTrainees.length}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {activeTrainees.map(t => (
                        <button 
                            key={t.name}
                            onClick={() => setSelectedTrainee(t.name)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group ${selectedTrainee === t.name ? 'border-sky-500 bg-white ring-4 ring-sky-500/5 shadow-md' : 'border-white bg-white/80 hover:border-slate-200 shadow-sm'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${selectedTrainee === t.name ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <UserCircleIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[16px] font-black text-slate-800 truncate">{t.name}</span>
                                    {selectedTrainee === t.name && <CheckCircleIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />}
                                </div>
                                {t.center && (
                                    <div className="mt-0.5">
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200 leading-none">
                                            {t.center}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                    {activeTrainees.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                            <InformationCircleIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                            <p className="text-slate-400 text-sm font-bold">現在、呼び出し可能な相手はいません。</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                        <PencilIcon className="w-3.5 h-3.5" /> 練習のテーマ（相手に通知されます）
                    </label>
                    <input 
                        type="text"
                        value={practiceTopic}
                        onChange={(e) => setPracticeTopic(e.target.value)}
                        placeholder="例：ahamoの解約抑止"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold text-sm text-slate-800 focus:bg-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    />
                </div>
                <button
                    onClick={handleCall}
                    disabled={!selectedTrainee || isCalling}
                    className="w-full bg-sky-600 text-white font-black py-4.5 rounded-xl shadow-xl hover:bg-sky-700 disabled:bg-slate-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-base group h-[58px]"
                >
                    {isCalling ? <LoadingIcon className="w-6 h-6" /> : <PhoneIcon className="w-6 h-6 group-hover:animate-bounce" />}
                    <span>呼び出しを開始する</span>
                </button>
            </div>

            <div className="pt-2 flex flex-col items-center">
                <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Ready for incoming calls
                </div>
            </div>
        </div>
    </div>
  );
};

export default OneOnOneHub;
