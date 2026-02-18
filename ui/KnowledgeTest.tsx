import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, PlayIcon, LoadingIcon, InformationCircleIcon, SparklesIcon } from './Icons.tsx';
import { MasterSetting, Center, TestQuestion } from '../types.ts';
import { useTestSession } from '../hooks/useTestSession.ts';
import TestResultModal from './TestResultModal.tsx';

interface KnowledgeTestProps {
  testQuestions: TestQuestion[];
  faqTopics: string[];
  masterSettings: MasterSetting[];
  traineeName: string;
  center: Center | null;
  apiKey: string | null;
  adminToken: string | null;
  onBack: () => void;
}

const KnowledgeTest: React.FC<KnowledgeTestProps> = ({ masterSettings, onBack, center, traineeName }) => {
  const { state, question, result, startTest, submitAnswer, reset } = useTestSession();
  const [userAnswer, setUserAnswer] = useState('');
  
  // マスタの全センターを表示
  const activeCenters = useMemo(() => {
    return [...masterSettings].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [masterSettings]);

  const [selectedCenter, setSelectedCenter] = useState(() => {
    if (center && activeCenters.some(s => s.abbreviation === center)) return center;
    return activeCenters.length > 0 ? activeCenters[0].abbreviation : '総合インフォ';
  });

  if (state === 'completed' && result && question) {
      return <TestResultModal result={{ ...result, questionText: question.questionText, userAnswer, timestamp: new Date().toLocaleString(), traineeName, center: selectedCenter, questionId: question.id, score: result.score, aiFeedback: result.evaluation, modelAnswer: result.modelAnswer || '', difficulty: question.difficulty }} onClose={reset} />;
  }

  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-2xl animate-fade-in max-w-2xl mx-auto border border-slate-100">
      <div className="mb-4 flex flex-row items-center">
        <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all whitespace-nowrap group">
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> <span className="leading-none">← 戻る</span>
        </button>
      </div>

      {state === 'selecting' && (
        <div className="space-y-4 text-left animate-fade-in">
            <h2 className="text-xl font-black text-slate-800 text-center tracking-tighter leading-none">知識テスト設定</h2>
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">業務範囲</label>
                    <div className="relative">
                      <select value={selectedCenter} onChange={e => setSelectedCenter(e.target.value)} className="w-full h-11 pl-4 pr-10 appearance-none bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 outline-none focus:border-sky-500 shadow-sm transition-all text-sm cursor-pointer">
                          {activeCenters.map(s => <option key={s.abbreviation} value={s.abbreviation}>🏢 {s.abbreviation}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                </div>
                <button onClick={() => startTest(selectedCenter, '最新プラン', '3')} className="w-full bg-sky-600 text-white font-black h-12 rounded-xl hover:bg-sky-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm">
                    <SparklesIcon className="h-4 w-4" />
                    <span>テストを開始</span>
                </button>
            </div>
            <p className="text-center text-[9px] text-slate-300 font-bold leading-none">※AIが業務範囲から最適な設問を動的に抽出・生成します。</p>
        </div>
      )}

      {state === 'generating' && <div className="py-16 text-center animate-pulse"><LoadingIcon className="h-10 w-10 mx-auto text-sky-600 mb-3" /><p className="text-sm font-black text-slate-800 tracking-tighter text-[11px]">AIが最適な設問を構成しています...</p></div>}

      {(state === 'in_progress' || state === 'submitting') && question && (
        <div className="space-y-4 animate-fade-in text-left">
            <div className="p-4 bg-slate-950 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                <h4 className="text-[8px] font-black text-sky-400 mb-2 uppercase tracking-[0.3em] flex items-center gap-1.5 relative z-10">
                    <InformationCircleIcon className="h-3 w-3" /> 
                    CUSTOMER INQUIRY
                </h4>
                <p className="text-[14px] text-white font-bold leading-relaxed relative z-10">{question.questionText}</p>
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">解答入力</label>
                <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="丁寧に応対してください..." rows={6} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:bg-white outline-none text-sm font-bold shadow-inner transition-all" disabled={state === 'submitting'} />
            </div>
            <button onClick={() => submitAnswer(userAnswer)} disabled={!userAnswer.trim() || state === 'submitting'} className="w-full bg-emerald-600 text-white font-black h-12 rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                {state === 'submitting' ? <><LoadingIcon className="h-4 w-4" /><span>採点中...</span></> : <span>提出して採点</span>}
            </button>
        </div>
      )}
    </div>
  );
};
export default KnowledgeTest;