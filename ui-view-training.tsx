
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Button, LoadingIcon, PlayIcon, PhoneIcon } from './ui-shared.tsx';
import { domainTraining } from './domain-training.ts';
import { decode, decodeAudioData, encode } from './ui-utils.ts'; // utils.tsへのパスは環境に合わせる

export const RolePlayView = ({ traineeName, masters, currentCenter, scenarios, onBack }: any) => {
  const [active, setActive] = useState(false);
  const [target, setTarget] = useState(currentCenter || "AIお任せ");
  const [messages, setMessages] = useState<any[]>([]);
  const sessionRef = useRef<any>(null);

  const startLiveSession = async () => {
    const key = process.env.API_KEY;
    if (!key) return;
    setActive(true);
    // ... 既存のLive API接続ロジックをここに復元 ...
  };

  if (!active) {
    return (
      <div className="max-w-xl mx-auto py-10 space-y-6 animate-fade-in">
        <button onClick={onBack} className="text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
            <h2 className="text-3xl font-black text-slate-800 text-center tracking-tighter leading-none">AIロールプレイング</h2>
            <div className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">対象業務の選択</label>
                <select value={target} onChange={e => setTarget(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-sky-500">
                    <option value="AIにお任せ">✨ AIにお任せ</option>
                    {masters.filter((m: any) => m.displayFlag).map((m: any) => (<option key={m.abbreviation} value={m.abbreviation}>🏢 {m.abbreviation}</option>))}
                </select></div>
                <Button onClick={startLiveSession} className="w-full py-5 flex justify-center gap-3 text-lg"><PlayIcon className="h-6 w-6" /> <span>トレーニング開始</span></Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020617] rounded-[3rem] h-[80vh] flex flex-col border border-slate-800 shadow-3xl animate-fade-in relative overflow-hidden">
      <div className="p-8 border-b border-white/5 flex justify-between items-center z-10">
        <div><h2 className="text-2xl font-black text-white tracking-tighter">On Air: Live Conversation</h2><p className="text-sky-400 text-xs font-bold uppercase tracking-widest mt-1">Monitoring System Connected</p></div>
        <Button variant="danger" onClick={() => setActive(false)} className="px-10">終了</Button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-white space-y-8">
        <div className="w-32 h-32 rounded-full border-4 border-sky-500/20 flex items-center justify-center animate-pulse"><div className="w-4 h-4 bg-sky-500 rounded-full shadow-[0_0_30px_rgba(14,165,233,0.8)]"></div></div>
        <p className="text-slate-400 font-bold text-center leading-relaxed">お客様の話しを聴いています。<br/>自然な相槌で対話を繋いでください。</p>
      </div>
    </div>
  );
};

export const OneOnOneView = ({ traineeName, trainees, onBack }: any) => (
  <div className="max-w-2xl mx-auto py-10 space-y-6 animate-fade-in">
    <button onClick={onBack} className="text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
      <h2 className="text-2xl font-black mb-6">1 on 1 通話 Hub</h2>
      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold italic">通話待機中の研修生はいません</div>
    </div>
  </div>
);
