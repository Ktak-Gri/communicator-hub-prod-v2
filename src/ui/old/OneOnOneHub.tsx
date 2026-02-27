import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Trainee, Scenario, OneOnOneSession, TranscriptItem, Center } from '../types.ts';
import { requestWithJsonp } from '../api.ts';
import { PhoneDownIcon, LoadingIcon, MicIcon, PlayIcon, UserCircleIcon, CheckCircleIcon, PhoneIcon, ArrowLeftIcon } from './Icons.tsx';

interface OneOnOneHubProps {
  traineeName: string;
  trainees: Trainee[];
  currentCenter: Center | null;
  onComplete: (transcript: TranscriptItem[], scenario: Scenario, persona: any) => void;
  isAnalyzing: boolean;
  onBack: () => void;
}

const OneOnOneHub: React.FC<OneOnOneHubProps> = ({ traineeName, trainees, onComplete, isAnalyzing, onBack }) => {
  const [session, setSession] = useState<OneOnOneSession | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<string>('');
  const [practiceTopic, setPracticeTopic] = useState<string>('');
  const [isCalling, setIsCalling] = useState(false);
  const recognitionRef = useRef<any>(null);

  const activeTrainees = useMemo(() => {
    // 比較用の今日の日付（時刻を00:00:00にリセット）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const myNameNormalized = (traineeName || "").trim().toLowerCase();

    return trainees
      .filter(t => {
          const raw = t as any;
          const name = String(raw.traineeName || raw.研修生名 || "").trim();
          const normalizedName = name.toLowerCase();
          
          // 自分自身を除外
          if (normalizedName === myNameNormalized) return false;
          if (!name) return false;

          // 研修終了日のチェック
          const endDateRaw = t.endDate || raw.研修終了日;
          if (endDateRaw) {
              try {
                  const end = new Date(endDateRaw);
                  if (!isNaN(end.getTime())) {
                      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                      // 今日より前（終了済み）の場合はリストから除外
                      if (endDateOnly < today) return false;
                  }
              } catch (e) {
                  console.warn("Date parse error:", name, endDateRaw);
              }
          }
          return true;
      })
      .map(t => {
          const raw = t as any;
          return {
              name: String(raw.traineeName || raw.研修生名 || "").trim(),
              center: String(raw.center || raw.センター || "未所属").trim()
          };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [trainees, traineeName]);

  const poll = useCallback(async () => {
    try {
      const res = await requestWithJsonp('pollCall', { traineeName });
      if (res.data) setSession(res.data);
      else setSession(null);
    } catch (e) {}
  }, [traineeName]);

  useEffect(() => {
    const timer = window.setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [poll]);

  const handleCall = async () => {
    if (!selectedTrainee) return;
    setIsCalling(true);
    await requestWithJsonp('initiateCall', { caller: traineeName, receiver: selectedTrainee, scenarioId: `TOPIC:${practiceTopic || '総合対話練習'}` });
    setIsCalling(false);
  };

  if (session) {
    return (
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white max-w-[360px] mx-auto text-center space-y-8 animate-fade-in border-2 border-slate-800 shadow-3xl">
        <UserCircleIcon className="w-20 h-20 text-sky-400 mx-auto animate-pulse" />
        <h2 className="text-xl font-black">{session.caller === traineeName ? session.receiver : session.caller} さんと接続中</h2>
        <button onClick={async () => { await requestWithJsonp('endCall', { sessionId: session.sessionId }); setSession(null); }} className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto hover:bg-rose-600 transition-all">
          <PhoneDownIcon className="w-8 h-8 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-4 flex flex-row items-center">
          <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all whitespace-nowrap group px-2">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span className="leading-none">← 戻る</span>
          </button>
      </div>
      <div className="bg-white rounded-[3rem] shadow-xl p-10 space-y-6 border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800">1 on 1 通話</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {activeTrainees.length > 0 ? activeTrainees.map(t => (
              <button key={t.name} onClick={() => setSelectedTrainee(t.name)} className={`p-3 rounded-xl border-2 transition-all text-xs font-bold ${selectedTrainee === t.name ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-50 bg-slate-50 text-slate-500'}`}>
                {t.name} ({t.center})
              </button>
            )) : (
              <div className="col-span-2 py-8 text-center text-slate-300 font-bold italic">呼び出し可能な研修生はいません</div>
            )}
          </div>
          <input type="text" value={practiceTopic} onChange={e => setPracticeTopic(e.target.value)} placeholder="練習のテーマ" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-sky-400" />
          <button onClick={handleCall} disabled={!selectedTrainee || isCalling} className="w-full bg-sky-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-sky-700 disabled:bg-slate-100 disabled:text-slate-300">
            {isCalling ? <LoadingIcon className="mx-auto" /> : '呼出を開始する'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default OneOnOneHub;