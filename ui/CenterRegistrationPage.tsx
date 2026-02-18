import React, { useState, useEffect, useMemo } from 'react';
import { Center, MasterSetting } from '../types.ts';
import { LoadingIcon, CheckCircleIcon, ArrowLeftIcon } from './Icons.tsx';

interface CenterRegistrationPageProps {
  traineeName: string;
  currentCenter: Center | null; 
  onUpdateUserSettings: (settings: { center: MasterSetting }) => void;
  displayableCenters: MasterSetting[];
  onLogout: () => void;
  onBack: () => void;
}

const CenterRegistrationPage: React.FC<CenterRegistrationPageProps> = ({ traineeName, currentCenter, onUpdateUserSettings, displayableCenters, onBack }) => {
  const normalize = (str: string) => str.replace(/[\s　]/g, "").toLowerCase();

  // displayFlag のフィルタを解除し、ソート順のみ適用
  const activeCenters = useMemo(() => {
    return [...displayableCenters].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [displayableCenters]);

  const initialCenterObject = useMemo(() => {
    if (!currentCenter) return null;
    const target = normalize(String(currentCenter));
    return activeCenters.find(s => 
        (s.abbreviation && normalize(s.abbreviation) === target) || 
        (s.name && normalize(s.name) === target)
    ) || null;
  }, [currentCenter, activeCenters]);
  
  const [selectedCenter, setSelectedCenter] = useState<MasterSetting | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (initialCenterObject) setSelectedCenter(initialCenterObject);
  }, [initialCenterObject]);

  const handleSave = () => {
    if (selectedCenter) {
      setIsSaving(true);
      onUpdateUserSettings({ center: selectedCenter });
    } else alert("所属センターを選択してください。");
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
        <div className="mb-4 flex flex-row items-center">
            <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all whitespace-nowrap group px-2">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                <span className="leading-none">← 戻る</span>
            </button>
        </div>

        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl space-y-4 border border-slate-100">
            <div className="text-center">
                <h1 className="text-xl font-black text-slate-800">所属センターの設定</h1>
                <p className="text-slate-500 text-[11px] font-bold mt-1">{traineeName}さん、現在の所属を選択してください。</p>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {activeCenters.map((centerInfo) => (
                <div 
                    key={centerInfo.abbreviation}
                    onClick={() => !isSaving && setSelectedCenter(centerInfo)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all border-2 cursor-pointer ${selectedCenter?.abbreviation === centerInfo.abbreviation ? 'border-sky-500 bg-sky-50' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                >
                    <span className="text-sm font-black text-slate-700">{centerInfo.name}</span>
                    {selectedCenter?.abbreviation === centerInfo.abbreviation && <CheckCircleIcon className="w-5 h-5 text-sky-500" />}
                </div>
            ))}
            </div>
            <button
                onClick={handleSave}
                className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl hover:bg-sky-700 shadow-lg flex items-center justify-center disabled:bg-slate-300 transform active:scale-95"
                disabled={!selectedCenter || isSaving}
            >
                {isSaving ? <LoadingIcon /> : <span>所属を確定する</span>}
            </button>
        </div>
    </div>
  );
};
export default CenterRegistrationPage;