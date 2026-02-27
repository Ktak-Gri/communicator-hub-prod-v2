import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, LoadingIcon, TrashIcon, CheckCircleIcon } from './Icons.tsx';
import { MasterSetting, MasterDataItem, TestQuestion } from '../types.ts';

interface TestQuestionEditorModalProps {
  onClose: () => void;
  onSave: (questionData: any) => Promise<void>;
  onDelete?: (e: React.MouseEvent | null, question: TestQuestion) => Promise<void>;
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
  
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const currentSheetId = useMemo(() => String(questionData?.id || "").trim(), [questionData]);
  const availableCenters = useMemo(() => [...masterSettings].sort((a,b) => a.sortOrder - b.sortOrder), [masterSettings]);

  useEffect(() => {
    if (questionData) {
      setName(questionData.name || '');
      setQuestionText(questionData.questionText || '');
      setAnswerText(questionData.answerText || '');
      setCenter(questionData.center || '');
      setDifficulty(Number(questionData.difficulty || 3));
      setSmartphonePlan(questionData.smartphonePlan || '');
      setLightPlan(questionData.lightPlan || '');
    }
  }, [questionData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    onSave({ ...questionData, name, questionText, answerText, center, difficulty, smartphonePlan, lightPlan });
  };

  const handleTriggerDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirmingDelete(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirmingDelete(false);
  };

  const handleFinalDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDelete && questionData) {
          onDelete(e, questionData as TestQuestion);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] pointer-events-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                {questionData?.internalId || questionData?.id ? 'テスト問題編集' : '新規テスト問題'}
            </h3>
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><CloseIcon className="h-5 w-5" /></button>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">管理ID</span>
              <span className="font-mono text-xs font-black text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {currentSheetId || <span className="text-slate-300 font-normal italic">AUTO_GEN</span>}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">問題タイトル</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 outline-none shadow-sm" required />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">対象センター</label>
                    <select value={center} onChange={e => setCenter(e.target.value)} className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-sky-500 outline-none cursor-pointer shadow-sm" required>
                        <option value="">選択してください</option>
                        {availableCenters.map(c => <option key={c.abbreviation} value={c.abbreviation}>{c.abbreviation}</option>)}
                    </select>
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

          <div className="p-4 bg-slate-50 border-t flex justify-between items-center px-10">
            <div>
              {onDelete && (questionData?.internalId || questionData?.id) ? (
                !isConfirmingDelete ? (
                  <button 
                    type="button" 
                    onClick={handleTriggerDelete} 
                    className="text-rose-500 hover:text-rose-700 font-black text-sm uppercase flex items-center gap-2 transition-all cursor-pointer relative z-[210]"
                  >
                    <TrashIcon className="h-5 w-5" /> <span>削除...</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                    <span className="text-[8px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded uppercase">本当に消す?</span>
                    <button 
                      type="button" 
                      onClick={handleFinalDelete} 
                      className="bg-rose-600 text-white font-black px-3 py-1.5 rounded-lg text-[10px] hover:bg-rose-700 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      disabled={isSaving}
                    >
                      はい
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelDelete} 
                      className="bg-slate-200 text-slate-600 font-black px-3 py-1.5 rounded-lg text-[10px] hover:bg-slate-300 active:scale-95 transition-all cursor-pointer"
                    >
                      戻る
                    </button>
                  </div>
                )
              ) : <div />}
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 font-black text-slate-400 hover:text-slate-600 text-xs cursor-pointer">キャンセル</button>
              <button type="submit" className="bg-sky-600 text-white font-black py-2.5 px-8 rounded-xl disabled:bg-slate-400 text-xs shadow-md transition-all active:scale-95 cursor-pointer" disabled={isSaving || isConfirmingDelete}>
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