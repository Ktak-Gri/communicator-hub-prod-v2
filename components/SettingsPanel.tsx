
import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Center, Scenario, MasterSetting } from '../types.ts';
import { PlayIcon, SparklesIcon, LoadingIcon } from './Icons.tsx';

interface SettingsPanelProps {
  currentSettings: Settings;
  onStart: (settings: { selectedCenter: Center; selectedScenario: Scenario; }) => void;
  scenarios: Scenario[];
  masterSettings: MasterSetting[];
  apiKey: string | null;
  adminToken: string | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentSettings, onStart, scenarios, masterSettings, apiKey, adminToken }) => {
  // センター選択の内部状態。初期値は "AIにお任せ"
  const [selectedCenter, setSelectedCenter] = useState<string>("AI_OMAKASE");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  /**
   * スプレッドシートのデータ構造（日本語ヘッダー等）から有効なセンターリストを抽出
   */
  const availableCenters = useMemo(() => {
    if (!masterSettings || !Array.isArray(masterSettings)) return [];
    
    return masterSettings
        .map((s, idx) => {
            const raw = s as any;
            // センター名の候補キーを網羅的に探索
            const abbr = raw["略称"] || raw["センター略称"] || raw["センター名"] || raw["name"] || raw["abbreviation"] || raw["abbr"] || "";
            
            // 表示フラグの候補キーを探索（未設定なら表示）
            const displayVal = raw["表示"] !== undefined ? raw["表示"] : raw["displayFlag"];
            const isVisible = displayVal !== undefined 
                ? (displayVal === true || String(displayVal).toLowerCase() === 'true' || displayVal === "TRUE") 
                : true;
                
            const order = Number(raw["ソート順"] || raw["sortOrder"] || idx);
            
            return { 
                abbr: String(abbr).trim(), 
                isVisible, 
                order,
                id: `center-opt-${idx}` // 重複防止用のユニークキー
            };
        })
        .filter(s => s.abbr !== "" && s.isVisible) // 名前があり、表示設定のもの
        .sort((a, b) => a.order - b.order);
  }, [masterSettings]);

  // 初期表示時：研修生の所属センターがリストにあればそれをセット
  useEffect(() => {
    if (currentSettings.selectedCenter) {
      const exists = availableCenters.some(c => c.abbr === currentSettings.selectedCenter);
      if (exists) {
        setSelectedCenter(currentSettings.selectedCenter);
      }
    }
  }, [currentSettings.selectedCenter, availableCenters]);
  
  const handleStart = async () => {
    setIsStarting(true);
    const targetCenterAbbr = selectedCenter === "AI_OMAKASE" ? null : selectedCenter;
    
    // 対象センターに応じたシナリオのフィルタリング
    const filteredScenarios = scenarios.filter(s => {
        if (!targetCenterAbbr) return true;
        const sCenter = String(s.center || (s as any).センター || '');
        return sCenter.includes(targetCenterAbbr);
    });

    const candidates = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    // FIX: Added difficulty and personality to the default scenario object to match Scenario type
    const scenario: Scenario = candidates[Math.floor(Math.random() * candidates.length)] || { 
        id: 'dummy', 
        name: '全般的な問い合わせ', 
        initialInquiry: '契約について聞きたい', 
        center: '全般', 
        smartphonePlan: '-', 
        lightPlan: '-',
        difficulty: 3,
        personality: '一般的'
    };

    // 接続演出
    setTimeout(() => {
        onStart({ selectedCenter: targetCenterAbbr || 'AIお任せ', selectedScenario: scenario });
        setIsStarting(false);
    }, 600);
  };
  
  return (
    <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-fade-in max-w-2xl mx-auto space-y-6 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-sky-50 rounded-full blur-2xl opacity-30"></div>
        
        <div className="text-center relative z-10 pb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">AIロールプレイング設定</h2>
        </div>

        {/* 対象業務の選択：プルダウン */}
        <div className="space-y-3 relative z-10 text-left">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 ml-1">
             <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
             対象業務の選択
          </label>
          <div className="relative group">
            <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full h-[62px] pl-12 pr-10 appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-black text-slate-700 outline-none transition-all hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/5 cursor-pointer shadow-sm"
            >
                <option value="AI_OMAKASE">✨ AIにお任せ（全業務から選定）</option>
                {availableCenters.map((center) => (
                    <option key={center.id} value={center.abbr}>
                        🏢 {center.abbr} {currentSettings.selectedCenter === center.abbr ? ' (あなたの所属)' : ''}
                    </option>
                ))}
            </select>
            
            {/* 装飾アイコン */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:scale-110">
                {selectedCenter === "AI_OMAKASE" ? (
                    <SparklesIcon className="h-6 w-6 text-sky-500" />
                ) : (
                    <div className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center border border-sky-200">
                        <div className="w-2 h-2 bg-sky-600 rounded-sm"></div>
                    </div>
                )}
            </div>
            
            {/* 矢印アイコン */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within:text-sky-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-bold italic px-2 leading-tight">
            ※あなたの所属センターが初期選択されています。
          </p>
        </div>

        {/* 難易度設定 */}
        <div className="space-y-3 relative z-10 text-left">
            <label className="text-sm font-black text-slate-800 flex items-center gap-2 ml-1">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                AI顧客の難易度
            </label>
            <div className="flex items-center justify-center gap-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button 
                    key={level} 
                    onClick={() => setSelectedDifficulty(level)} 
                    className={`text-4xl transition-all transform active:scale-90 ${selectedDifficulty !== null && level <= selectedDifficulty ? 'text-amber-400' : 'text-slate-200'}`}
                  >
                    ★
                  </button>
                ))}
            </div>
        </div>

        <div className="pt-4 text-center relative z-10">
          <button 
            onClick={handleStart} 
            className="w-full bg-sky-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-sky-700 transition-all shadow-xl flex items-center justify-center mx-auto disabled:bg-slate-200 transform active:scale-95 text-[18px] h-[64px]" 
            disabled={isStarting}
          >
            {isStarting ? (
                <div className="flex items-center gap-3">
                    <LoadingIcon className="h-6 w-6" />
                    <span className="font-bold">AI顧客に接続中...</span>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <PlayIcon className="h-6 w-6" />
                    <span className="tracking-widest">トレーニングを開始する</span>
                </div>
            )}
          </button>
        </div>
    </div>
  );
};
export default SettingsPanel;
