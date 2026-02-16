import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, LoadingIcon, TrashIcon } from './Icons.tsx';
import { MasterSetting, MasterDataItem } from '../types.ts';

interface TestQuestionEditorModalProps {
  onClose: () => void;
  onSave: (questionData: any) => Promise<void>;
  onDelete?: (e: React.MouseEvent) => void;
  questionData: any | null;
  isSaving: boolean;
  masterSettings: MasterSetting[];
  personalities: MasterDataItem[];
}

const TestQuestionEditorModal: React.FC<TestQuestionEditorModalProps> = ({ onClose, onSave, onDelete, questionData, isSaving, masterSettings, personalities }) => {
  const [name, setName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [center, setCenter] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [smartphonePlan, setSmartphonePlan] = useState('');
  const [lightPlan, setLightPlan] = useState('');

  const availableCenters = useMemo(() => [...masterSettings].sort((a,b) => a.sortOrder - b.sortOrder), [masterSettings]);

  useEffect(() => {
    if (questionData) {
      setName(questionData.name || (questionData as any).テスト名 || '');
      setQuestionText(questionData.questionText || (questionData as any).問題文 || '');
      setAnswerText(questionData.answerText || (questionData as any).解答 || '');
      setCenter(questionData.center || (questionData as any).センター || '');
      setDifficulty(Number(questionData.difficulty || (questionData as any).難易度 || 3));
      setSmartphonePlan(questionData.smartphonePlan || (questionData as any).スマホプラン || '');
      setLightPlan(questionData.lightPlan || (questionData as any).光プラン || '');
    } else {
      setName(''); setQuestionText(''); setAnswerText(''); setCenter(''); setDifficulty(3); setSmartphonePlan(''); setLightPlan('');
    }
  }, [questionData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    onSave({ 
        ...questionData, 
        name, 
        questionText, 
        answerText, 
        center, 
        difficulty,
        smartphonePlan,
        lightPlan
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] pointer-events-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{questionData?.id ? 'テスト問題編集' : '新規テスト問題'}</h3>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><CloseIcon className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">問題タイトル</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none" required />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">対象センター</label>
                    <select value={center} onChange={e => setCenter(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none cursor-pointer" required>
                        <option value="">選択してください</option>
                        {availableCenters.map(c => <option key={c.abbreviation} value={c.abbreviation}>{c.abbreviation}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">想定スマホプラン</label>
                    <input type="text" value={smartphonePlan} onChange={e => setSmartphonePlan(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">想定光プラン</label>
                    <input type="text" value={lightPlan} onChange={e => setLightPlan(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none" />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">難易度</label>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-100 justify-center">
                    {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setDifficulty(v)} className={`text-2xl transition-all transform active:scale-90 cursor-pointer ${v <= difficulty ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                    ))}
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">問題文（顧客の問いかけ）</label>
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none shadow-inner" rows={3} required />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">模範解答</label>
                <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 focus:bg-white transition-all outline-none shadow-inner" rows={4} required />
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
            <div className="flex gap-2">
                {onDelete && questionData?.id && (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }} className="flex items-center gap-1.5 px-4 py-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all font-black text-xs cursor-pointer">
                        <TrashIcon className="h-4 w-4" /> <span>この問題を削除</span>
                    </button>
                )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 font-black text-slate-400 hover:text-slate-600 text-xs cursor-pointer">キャンセル</button>
              <button type="submit" className="bg-sky-600 text-white font-black py-2.5 px-8 rounded-xl shadow-lg hover:bg-sky-700 transition-all disabled:bg-slate-400 text-xs cursor-pointer" disabled={isSaving}>
                {isSaving ? <LoadingIcon className="h-4 w-4" /> : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TestQuestionEditorModal;