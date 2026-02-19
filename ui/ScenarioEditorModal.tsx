import React, { useState, useEffect, useMemo } from 'react';
import { Scenario, MasterSetting, MasterDataItem } from '../types.ts';
import { CloseIcon, LoadingIcon, TrashIcon } from './Icons.tsx';

interface ScenarioEditorModalProps {
  onClose: () => void;
  onSave: (scenario: Omit<Scenario, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (e: React.MouseEvent | null, scenario: Scenario) => Promise<void>;
  scenario: Scenario | null;
  masterSettings: MasterSetting[];
  personalities: MasterDataItem[];
  isSaving: boolean;
}

const ScenarioEditorModal: React.FC<ScenarioEditorModalProps> = ({ onClose, onSave, onDelete, scenario, masterSettings, personalities, isSaving }) => {
  const [name, setName] = useState('');
  const [initialInquiry, setInitialInquiry] = useState('');
  const [center, setCenter] = useState<string>('');
  const [difficulty, setDifficulty] = useState(3);
  const [smartphonePlan, setSmartphonePlan] = useState('');
  const [lightPlan, setLightPlan] = useState('');
  const [personality, setPersonality] = useState('');
  
  // モーダル内削除確認ステート
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const currentSheetId = useMemo(() => String(scenario?.id || "").trim(), [scenario]);

  const availableCenters = useMemo(() =>
    [...masterSettings]
      .filter(c => c && c.abbreviation && c.abbreviation.trim() !== "")
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [masterSettings]
  );

  // 初期値のセット
  useEffect(() => {
    if (scenario && (scenario.id || scenario.internalId)) {
      setName(scenario.name || '');
      setInitialInquiry(scenario.initialInquiry || '');
      setDifficulty(Number(scenario.difficulty || 3));
      setCenter(scenario.center || '');
      setSmartphonePlan(scenario.smartphonePlan || '');
      setLightPlan(scenario.lightPlan || '');
      setPersonality(scenario.personality || '');
    } else {
      // 新規作成時の初期化
      setName('');
      setInitialInquiry('');
      setDifficulty(3);
      setCenter('');
      setSmartphonePlan('');
      setLightPlan('');
      setPersonality('');
    }
  }, [scenario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    onSave({ 
        ...scenario, 
        name, 
        initialInquiry, 
        center, 
        difficulty, 
        smartphonePlan, 
        lightPlan, 
        personality: personality.trim() 
    } as any);
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
      if (onDelete && scenario) {
          onDelete(e, scenario);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] pointer-events-auto overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-8 py-5 border-b flex justify-between items-center bg-white">
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                {scenario?.internalId || scenario?.id ? 'シナリオの編集' : '新規シナリオ作成'}
            </h3>
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><CloseIcon className="h-6 w-6" /></button>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">管理ID</span>
              <span className="font-mono text-base font-black text-slate-600 bg-white px-4 py-1.5 rounded border border-slate-200">
                {currentSheetId || <span className="text-slate-300 font-normal italic">NEW</span>}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">シナリオ名</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-base focus:border-sky-500 outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">対象センター</label>
                    <select value={center} onChange={e => setCenter(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-base focus:border-sky-500 outline-none transition-all cursor-pointer" required>
                        <option value="">選択してください</option>
                        {availableCenters.map(c => <option key={c.abbreviation} value={c.abbreviation}>{c.abbreviation}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">スマホプラン</label>
                    <input type="text" value={smartphonePlan} onChange={e => setSmartphonePlan(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-base outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">光プラン</label>
                    <input type="text" value={lightPlan} onChange={e => setLightPlan(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-base outline-none" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">顧客の性質</label>
                <select 
                  value={personality} 
                  onChange={e => setPersonality(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-base focus:border-sky-500 outline-none transition-all cursor-pointer" 
                  required
                >
                    <option value="">選択してください</option>
                    {personalities.map((p, idx) => (
                      <option key={`${p.name}-${idx}`} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center block">AI顧客の難易度</label>
                <div className="flex gap-8 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 justify-center">
                    {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setDifficulty(v)} className={`text-4xl transition-all transform active:scale-90 cursor-pointer ${v <= difficulty ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">AI顧客への指示（問い合わせ内容）</label>
                <textarea value={initialInquiry} onChange={e => setInitialInquiry(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-base focus:border-sky-500 outline-none shadow-inner" rows={4} required />
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t flex justify-between items-center px-10">
            <div>
              {onDelete && (scenario?.internalId || scenario?.id) ? (
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
                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-1 rounded uppercase tracking-tighter mr-1">本当に消しますか？</span>
                    <button 
                      type="button" 
                      onClick={handleFinalDelete} 
                      className="bg-rose-600 text-white font-black px-4 py-2 rounded-lg text-xs hover:bg-rose-700 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      disabled={isSaving}
                    >
                      はい
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelDelete} 
                      className="bg-slate-200 text-slate-600 font-black px-4 py-2 rounded-lg text-xs hover:bg-slate-300 active:scale-95 transition-all cursor-pointer"
                    >
                      戻る
                    </button>
                  </div>
                )
              ) : <div />}
            </div>

            <div className="flex gap-4">
                <button type="button" onClick={onClose} className="px-6 py-3 font-black text-slate-400 text-sm uppercase hover:text-slate-600 transition-all cursor-pointer">キャンセル</button>
                <button type="submit" className="bg-sky-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg hover:bg-sky-700 transition-all text-sm uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50" disabled={isSaving || isConfirmingDelete}>
                  {isSaving ? <LoadingIcon className="h-5 w-5 text-white" /> : '保存する'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ScenarioEditorModal;