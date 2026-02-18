import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Center, Scenario, MasterSetting } from '../types.ts';
import { PlayIcon, SparklesIcon, LoadingIcon, ArrowLeftIcon } from './Icons.tsx';

interface SettingsPanelProps {
  currentSettings: Settings;
  onStart: (settings: { selectedCenter: Center; selectedScenario: Scenario; }) => void;
  scenarios: Scenario[];
  masterSettings: MasterSetting[];
  apiKey: string | null;
  adminToken: string | null;
  onBack: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentSettings, onStart, scenarios, masterSettings, apiKey, adminToken, onBack }) => {
  const [selectedCenter, setSelectedCenter] = useState<string>(currentSettings.selectedCenter || "AI_OMAKASE");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // マスタの全センターを表示（displayFlag無視）
  const availableCenters = useMemo(() => {
    if (!masterSettings || !Array.isArray(masterSettings)) return [];
    return [...masterSettings]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s, idx) => ({
            abbr: s.abbreviation || s.name,
            id: `center-opt-${idx}`
        }));
  }, [masterSettings]);

  useEffect(() => {
    if (currentSettings.selectedCenter) {
      const exists = availableCenters.some(c => c.abbr === currentSettings.selectedCenter);
      if (exists) setSelectedCenter(currentSettings.selectedCenter);
    }
  }, [currentSettings.selectedCenter, availableCenters]);
  
  const handleStart = async () => {
    setIsStarting(true);
    const targetCenterAbbr = selectedCenter === "AI_OMAKASE" ? null : selectedCenter;
    const filteredScenarios = scenarios.filter(s => {
        if (!targetCenterAbbr) return true;
        const sCenter = String(s.center || (s as any).センター || '');
        return sCenter.includes(targetCenterAbbr);
    });
    const candidates = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    const scenario: Scenario = candidates[Math.floor(Math.random() * candidates.length)] || { 
        id: 'dummy', internalId: 'dummy-internal', name: '全般的な問い合わせ', initialInquiry: '契約について聞きたい', center: '全般', smartphonePlan: '-', lightPlan: '-', difficulty: 3, personality: '一般的'
    };
    setTimeout(() => {
        onStart({ selectedCenter: targetCenterAbbr || 'AIお任せ', selectedScenario: scenario });
        setIsStarting(false);
    }, 600);
  };
  
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
        <div className="mb-4 flex flex-row items-center">
            <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all group px-2 whitespace-nowrap">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                <span className="leading-none">← 戻る</span>
            </button>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-24 h-24 bg-sky-50 rounded-full blur-2xl opacity-30"></div>
            <div className="text-center relative z-10">
                <h2 className="text-xl font-black text-slate-800 tracking-tighter leading-none">AIロールプレイング設定</h2>
            </div>
            <div className="space-y-2 relative z-10 text-left">
              <label className="text-xs font-black text-slate-700 flex items-center gap-2 ml-1 uppercase tracking-widest">
                  対象業務
              </label>
              <div className="relative group">
                  <select
                      value={selectedCenter}
                      onChange={(e) => setSelectedCenter(e.target.value)}
                      className="w-full h-[48px] pl-10 pr-10 appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black text-slate-700 outline-none transition-all focus:border-sky-500 cursor-pointer shadow-sm"
                  >
                      <option value="AI_OMAKASE">✨ AIにお任せ</option>
                      {availableCenters.map((center) => (
                          <option key={center.id} value={center.abbr}>🏢 {center.abbr}</option>
                      ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {selectedCenter === "AI_OMAKASE" ? <SparklesIcon className="h-4 w-4 text-sky-500" /> : <div className="w-4 h-4 bg-sky-100 rounded flex items-center justify-center border border-sky-200"><div className="w-1.5 h-1.5 bg-sky-600 rounded-sm"></div></div>}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
              </div>
            </div>
            <div className="space-y-2 relative z-10 text-left">
                <label className="text-xs font-black text-slate-700 flex items-center gap-2 ml-1 uppercase tracking-widest">
                    難易度
                </label>
                <div className="flex items-center justify-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-inner">
                    {[1, 2, 3, 4, 5].map((level) => (
                    <button key={level} onClick={() => setSelectedDifficulty(level)} className={`text-3xl transition-all transform active:scale-90 ${selectedDifficulty !== null && level <= selectedDifficulty ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                    ))}
                </div>
            </div>
            <div className="pt-2 text-center relative z-10">
            <button onClick={handleStart} className="w-full bg-sky-600 text-white font-black h-[52px] rounded-xl hover:bg-sky-700 transition-all shadow-lg flex items-center justify-center mx-auto disabled:bg-slate-200 transform active:scale-95 text-base" disabled={isStarting}>
                {isStarting ? <><LoadingIcon className="h-5 w-5 mr-2" /><span>接続中...</span></> : <><PlayIcon className="h-5 w-5 mr-2" /><span className="tracking-widest">トレーニングを開始</span></>}
            </button>
            </div>
        </div>
    </div>
  );
};
export default SettingsPanel;