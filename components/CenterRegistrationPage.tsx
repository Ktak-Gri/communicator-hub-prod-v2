import React, { useState, useEffect, useMemo } from 'react';
import { Center, MasterSetting } from '../types.ts';
import { PlayIcon, LoadingIcon, CheckCircleIcon } from './Icons.tsx';

interface CenterRegistrationPageProps {
  traineeName: string;
  currentCenter: Center | null; 
  onUpdateUserSettings: (settings: { center: MasterSetting }) => void;
  displayableCenters: MasterSetting[];
  onLogout: () => void;
}

const CenterRegistrationPage: React.FC<CenterRegistrationPageProps> = ({ traineeName, currentCenter, onUpdateUserSettings, displayableCenters, onLogout }) => {
  // センター名の正規化
  const normalize = (str: string) => str.replace(/[\s　]/g, "").toLowerCase();

  const initialCenterObject = useMemo(() => {
    if (!currentCenter) return null;
    const target = normalize(String(currentCenter));
    return displayableCenters.find(s => 
        (s.abbreviation && normalize(s.abbreviation) === target) || 
        (s.name && normalize(s.name) === target)
    ) || null;
  }, [currentCenter, displayableCenters]);
  
  const [selectedCenter, setSelectedCenter] = useState<MasterSetting | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (initialCenterObject) {
        setSelectedCenter(initialCenterObject);
    }
  }, [initialCenterObject]);

  const handleSave = () => {
    if (selectedCenter) {
      setIsSaving(true);
      onUpdateUserSettings({ center: selectedCenter });
    } else {
      alert("所属センターを選択してください。");
    }
  };

  return (
    <div className="bg-white p-3 sm:p-5 rounded-3xl shadow-xl animate-fade-in w-full max-w-xl mx-auto space-y-2 border border-slate-100 mt-1">
        <div className="text-center">
            <div className="inline-flex p-1.5 bg-sky-50 rounded-lg mb-0.5">
                <PlayIcon className="h-5 w-5 text-sky-600" />
            </div>
            <h1 className="text-lg font-black text-slate-800 leading-tight">所属センターの確認</h1>
            <p className="text-slate-500 text-[10px] font-bold">{traineeName}さん、所属を選択してください。</p>
        </div>

        <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">利用可能なセンター</h3>
                {selectedCenter && (
                    <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 flex items-center gap-1 animate-fade-in">
                        <CheckCircleIcon className="w-2.5 h-2.5" /> 指定済み
                    </span>
                )}
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {displayableCenters.length > 0 ? (
                displayableCenters.map((centerInfo) => (
                    <div 
                        key={centerInfo.abbreviation}
                        onClick={() => !isSaving && setSelectedCenter(centerInfo)}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all border-2 cursor-pointer group ${selectedCenter?.abbreviation === centerInfo.abbreviation ? 'border-sky-500 bg-sky-50' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex-1 min-w-0 pr-2">
                            <span className={`text-[14.5px] font-black leading-tight ${selectedCenter?.abbreviation === centerInfo.abbreviation ? 'text-sky-700' : 'text-slate-700'}`}>
                                {centerInfo.name}
                                {centerInfo.abbreviation && (
                                    <span className="ml-1 opacity-70 font-bold">（{centerInfo.abbreviation}）</span>
                                )}
                            </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${selectedCenter?.abbreviation === centerInfo.abbreviation ? 'bg-sky-500 border-sky-500 shadow-sm' : 'border-slate-200 bg-white'}`}>
                            {selectedCenter?.abbreviation === centerInfo.abbreviation && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-bold italic">
                    データを取得中...
                </div>
            )}
            </div>
        </div>

        <div className="pt-2 flex flex-col items-center">
            <button
                onClick={handleSave}
                className="w-full bg-sky-600 text-white font-black py-3 rounded-xl hover:bg-sky-700 transition-all shadow-lg flex items-center justify-center disabled:bg-slate-300 transform active:scale-95 text-sm tracking-tight"
                disabled={!selectedCenter || isSaving}
            >
                {isSaving ? (
                    <div className="flex items-center gap-2">
                        <LoadingIcon className="h-4 w-4" />
                        <span>保存中</span>
                    </div>
                ) : (
                    <span>所属を確定してメニューへ戻る</span>
                )}
            </button>
        </div>
    </div>
  );
};

export default CenterRegistrationPage;