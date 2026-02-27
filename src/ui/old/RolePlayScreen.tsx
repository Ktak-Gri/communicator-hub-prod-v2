import React, { useEffect, useRef } from 'react';
import { Scenario, TranscriptItem } from '../types.ts';
import { LoadingIcon, ArrowLeftIcon, PhoneDownIcon, PhoneIcon, SparklesIcon, MicIcon, WifiOffIcon } from './Icons.tsx';
import { useRolePlaySession } from '../hooks/useRolePlaySession.ts';

interface RolePlayScreenProps {
  scenario: Scenario;
  traineeName: string;
  center: string | null;
  apiKey: string | null;
  onBack: () => void;
  onComplete: (transcript: TranscriptItem[], scenario: Scenario, persona: any) => void | Promise<void>;
  isAnalyzing: boolean;
}

const RolePlayScreen: React.FC<RolePlayScreenProps> = ({
  scenario,
  traineeName,
  onBack,
  onComplete,
  isAnalyzing
}) => {
  const { messages, status, persona, startSession, setStatus } = useRolePlaySession(scenario, traineeName);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-[82vh] bg-[#020617] rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-800 text-slate-100 relative animate-fade-in">
      <div className="flex justify-between items-center px-6 py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50 relative z-20">
        <div className="space-y-0.5">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-sky-400 tracking-widest uppercase transition-all mb-1">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> <span>戻る</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white tracking-tighter leading-none">{scenario.name}</h2>
            {status === 'connected' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-500/50 animate-pulse">通話中</span>}
          </div>
        </div>
        {status === 'connected' && (
          <button onClick={() => { setStatus('analyzing'); onComplete(messages, scenario, persona); }} disabled={isAnalyzing || messages.length < 1} className="bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 px-6 rounded-xl shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-20 text-xs">
            {isAnalyzing ? <LoadingIcon className="h-4 w-4" /> : <PhoneDownIcon className="h-4 w-4" />}
            <span>終了・評価</span>
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        {status === 'ringing' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl">
            <div className="w-24 h-24 bg-slate-900 border-2 border-sky-500/50 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <PhoneIcon className="h-12 w-12 text-sky-400 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black mb-8 tracking-tighter">入電があります</h3>
            <button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 rounded-[2rem] shadow-2xl text-xl font-black tracking-widest active:scale-95 transition-all">受電する</button>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 animate-fade-in px-10 text-center">
            <WifiOffIcon className="h-16 w-16 text-rose-500 mb-6" />
            <h3 className="text-xl font-black text-rose-400 mb-2">接続エラー</h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8">
              音声サーバーへの接続に失敗しました。<br/>
              APIキーの設定やネットワーク環境を確認してください。
            </p>
            <button onClick={onBack} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black text-sm">メニューに戻る</button>
          </div>
        )}
        
        {status === 'connecting' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 animate-fade-in">
            <LoadingIcon className="h-10 w-10 text-sky-500 mb-4" />
            <p className="font-black text-sky-400 text-xs tracking-widest uppercase">Connecting to Voice Client...</p>
          </div>
        )}

        {(status === 'connected' || status === 'analyzing') && (
          <div className="h-full p-6 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-slate-950/50">
            {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                <SparklesIcon className="h-32 w-32" />
                <p className="font-black text-sm uppercase tracking-[0.3em]">Ready to Voice Chat</p>
            </div>}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.speaker === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{msg.speaker === 'user' ? traineeName : 'CUSTOMER'}</span>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] font-bold leading-relaxed shadow-xl ${msg.speaker === 'user' ? 'bg-sky-800 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
export default RolePlayScreen;