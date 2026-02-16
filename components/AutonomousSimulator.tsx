import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Scenario, MasterSetting, SimulationResult, TranscriptItem } from '../types.ts';
import { 
    LoadingIcon, 
    PlayIcon, 
    SparklesIcon, 
    StopCircleIcon,
    ChatBubbleLeftRightIcon
} from './Icons.tsx';
import { generateAiContentAsync } from '../api.ts';

interface AutonomousSimulatorProps {
  scenarios: Scenario[];
  masterSettings: MasterSetting[];
  adminToken: string | null;
  apiKey: string | null;
}

const MAX_TURNS = 5; // 5 turns for customer, 5 for operator

/**
 * 曖昧なキー名から値を取得するユーティリティ (V6.21.34: Unified Title Logic)
 */
const normalizeKey = (k: string) => 
    String(k || "")
     .replace(/[\s　]/g, '')
     .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
     .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
     .toLowerCase();

const getFuzzyValue = (obj: any, candidates: string[]) => {
    if (!obj) return null;
    const keys = Object.keys(obj);
    const normalizedKeys = keys.map(k => ({ original: k, normalized: normalizeKey(k) }));
    const normalizedCandidates = candidates.map(c => normalizeKey(c));

    for (const nc of normalizedCandidates) {
        const found = normalizedKeys.find(nk => nk.normalized === nc);
        if (found && obj[found.original] !== undefined && obj[found.original] !== null && String(obj[found.original]).trim() !== "") {
            return String(obj[found.original]).trim();
        }
    }

    const sortedKeys = [...normalizedKeys].sort((a, b) => a.normalized.length - b.normalized.length);
    for (const nc of normalizedCandidates) {
        const found = sortedKeys.find(nk => nk.normalized.includes(nc) || nc.includes(nk.normalized));
        if (found && obj[found.original] !== undefined && obj[found.original] !== null && String(obj[found.original]).trim() !== "") {
            return String(obj[found.original]).trim();
        }
    }
    return null;
};

const AutonomousSimulator: React.FC<AutonomousSimulatorProps> = ({ scenarios, masterSettings, adminToken, apiKey }) => {
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, scenarioName: '' });
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const isStoppingRef = useRef(false);

  /**
   * スプレッドシートの日本語ヘッダーやデータ型に依存しないプロパティ取得 (V6.21.34: Scenario name priority)
   */
  const getFuzzy = useCallback((s: any, idx: number) => {
      if (!s) return { id: `empty-${idx}`, name: '無効なデータ' };
      
      const stableId = s.id || s.ID || s["管理番号"] || `row-${idx}`;
      // 「シナリオ名」を最優先で取得
      const name = getFuzzyValue(s, [
          "シナリオ名", "テスト名", "問題名", "タイトル", "題名", "名称", "案件"
      ]) || `シナリオ (${idx + 1})`;

      return {
          id: String(stableId).trim(),
          name: name,
          center: getFuzzyValue(s, ["センター", "対象", "center", "target", "所属", "部門", "略称"]) || '',
          smartphonePlan: getFuzzyValue(s, ["スマホプラン", "スマートフォン", "プラン"]) || '-',
          lightPlan: getFuzzyValue(s, ["光プラン", "光", "ネット回線"]) || '-',
          initialInquiry: getFuzzyValue(s, ["問い合わせ内容", "最初の問い合わせ内容", "問題文", "内容", "質問", "本文"]) || ''
      };
  }, []);

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedScenarioIds(scenarios.map((s, idx) => getFuzzy(s, idx).id));
    } else {
      setSelectedScenarioIds([]);
    }
  };

  const handleStopSimulation = () => {
    isStoppingRef.current = true;
  };

  const handleStartSimulation = useCallback(async () => {
    if (selectedScenarioIds.length === 0) {
      setError("シミュレーションを実行するシナリオを1つ以上選択してください。");
      return;
    }
    
    if (!adminToken) {
        setError("管理者としてログインされていません。シミュレーターを実行するには管理者権限が必要です。");
        setSimulationState('idle');
        return;
    }

    setSimulationState('running');
    setResults([]);
    setError(null);
    isStoppingRef.current = false;
    
    const scenariosToRun = scenarios.filter((s, idx) => selectedScenarioIds.includes(getFuzzy(s, idx).id));
    const total = scenariosToRun.length;
    let newResults: SimulationResult[] = [];

    for (let i = 0; i < total; i++) {
        if (isStoppingRef.current) break;

        const rawScenario = scenariosToRun[i];
        const scenario = getFuzzy(rawScenario, i); 
        setProgress({ current: i + 1, total, scenarioName: scenario.name });

        let currentResult: SimulationResult = {
            scenario: rawScenario,
            transcript: [],
            analysis: '',
        };

        try {
            const customerSystemInstruction = `あなたは携帯電話会社のコールセンターに電話をかけてきた顧客です。コミュニケーターの応答を評価する必要はなく、顧客として自然に振る舞ってください。
            # 契約状況
            - スマホプラン: ${scenario.smartphonePlan}
            - 光プラン: ${scenario.lightPlan}
            # 問い合わせ内容
            ${scenario.initialInquiry}
            # 指示
            1. 上記の状況なりきり、問い合わせ内容から自然な会話を始めてください。
            2. 会話はすべて日本語で行ってください。
            3. 返答は常に簡潔に、1〜2文程度にしてください。`;
            let customerHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];

            const operatorSystemInstruction = `あなたは携帯電話会社のコールセンターの優秀なコミュニケーターです。顧客の問い合わせに丁寧かつ適切に対応してください。会話はすべて日本語で行い、返答は常に簡潔に、1〜2文程度にしてください。`;
            let operatorHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];

            let lastMessage = scenario.initialInquiry || "契約内容について確認したいのですが";
            currentResult.transcript.push({ speaker: 'AI Customer', text: lastMessage });
            operatorHistory.push({ role: 'user', parts: [{ text: lastMessage }] });

            for (let turn = 0; turn < MAX_TURNS; turn++) {
                 if (isStoppingRef.current) break;
                 
                // Fixed: Removed extra arguments (adminToken, apiKey)
                const { data: operatorResponseString } = await generateAiContentAsync({
                    contents: operatorHistory,
                    systemInstruction: operatorSystemInstruction
                });
                
                lastMessage = operatorResponseString;
                currentResult.transcript.push({ speaker: 'コミュニケーター', text: lastMessage });

                operatorHistory.push({ role: 'model', parts: [{ text: lastMessage }] });
                customerHistory.push({ role: 'user', parts: [{ text: lastMessage }] }); 

                if (isStoppingRef.current) break;

                // Fixed: Removed extra arguments (adminToken, apiKey)
                const { data: customerResponseString } = await generateAiContentAsync({
                    contents: customerHistory,
                    systemInstruction: customerSystemInstruction
                });
                
                lastMessage = customerResponseString;
                currentResult.transcript.push({ speaker: 'AI Customer', text: lastMessage });
                
                customerHistory.push({ role: 'model', parts: [{ text: lastMessage }] });
                operatorHistory.push({ role: 'user', parts: [{ text: lastMessage }] }); 
            }

            const transcriptText = currentResult.transcript.map(t => `${t.speaker === 'AI Customer' ? '顧客' : 'コミュニケーター'}: ${t.text}`).join('\n');
            const analysisPrompt = `以下のAIコミュニケーターとAI顧客の会話ログを分析し、コミュニケーターの応答が適切であったか、どのような応答パターンが見られたかを3〜4文の短い段落にまとめて簡潔に分析してください。
            # 会話ログ
            ${transcriptText}
            `;
            // Fixed: Removed extra arguments (adminToken, apiKey)
            const { data: analysisResponseString } = await generateAiContentAsync({
                prompt: analysisPrompt
            });
            currentResult.analysis = analysisResponseString;

        } catch (e: any) {
            currentResult.error = e.message;
            currentResult.analysis = "エラーのため分析できませんでした。";
        }
        
        newResults.push(currentResult);
        setResults([...newResults]); 
    }

    setSimulationState('completed');
  }, [selectedScenarioIds, scenarios, adminToken, apiKey, getFuzzy]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-slate-800">AI応答パターン 自律シミュレーター</h3>
      <p className="mt-1 text-slate-600 text-sm">選択したシナリオでAI同士の対話を実行し、コミュニケーター役AIの応答パターンを分析します。</p>

      {error && <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p className="font-bold">エラー</p><p>{error}</p></div>}
      
      {simulationState !== 'running' && (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-2 px-1">
                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-sky-500 rounded-full"></div>
                   1. シナリオ選択
                </h4>
                <div className="space-x-3">
                    <button onClick={() => handleSelectAll(true)} className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors">すべて選択</button>
                    <button onClick={() => handleSelectAll(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">すべて解除</button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border-2 border-slate-100 p-4 rounded-xl max-h-72 overflow-y-auto bg-slate-50/50 shadow-inner custom-scrollbar">
                {scenarios.length > 0 ? scenarios.map((s, idx) => {
                    const fs = getFuzzy(s, idx);
                    const sid = fs.id;
                    const isSelected = selectedScenarioIds.includes(sid);
                    return (
                        <label key={sid} className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all cursor-pointer shadow-sm group ${isSelected ? 'border-sky-500 bg-white ring-2 ring-sky-500/5' : 'border-white bg-white/60 hover:border-slate-200'}`}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                    setSelectedScenarioIds(prev => e.target.checked ? [...prev, sid] : prev.filter(id => id !== sid));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className={`text-[11px] font-black truncate flex-1 ${isSelected ? 'text-sky-700' : 'text-slate-600'}`} title={fs.name}>{fs.name}</span>
                        </label>
                    );
                }) : (
                    <div className="col-span-full py-16 text-center text-slate-300 font-bold italic text-sm">シナリオが読み込まれていません。</div>
                )}
            </div>
        </div>
      )}

      <div className="mt-8">
        <h4 className="font-bold text-slate-700 text-sm mb-3 px-1 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            2. シミュレーション実行
        </h4>
         <div className="flex items-center gap-3">
            <button 
                onClick={handleStartSimulation} 
                disabled={simulationState === 'running' || selectedScenarioIds.length === 0}
                className="bg-sky-600 text-white font-black py-4 px-10 rounded-xl hover:bg-sky-700 transition flex items-center justify-center disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xl active:scale-95 text-base flex-1 md:flex-initial min-w-[280px]"
            >
                <PlayIcon className="h-5 w-5 mr-2" />
                <span>
                    {selectedScenarioIds.length > 0
                        ? `${selectedScenarioIds.length}件のシミュレーションを開始`
                        : 'シナリオを選択してください'
                    }
                </span>
            </button>
            {simulationState === 'running' && (
                <button 
                    onClick={handleStopSimulation} 
                    className="bg-rose-500 text-white font-black py-4 px-8 rounded-xl hover:bg-rose-600 transition flex items-center justify-center shadow-xl active:scale-95 text-base"
                >
                    <StopCircleIcon className="h-5 w-5 mr-2" />
                    <span>停止</span>
                </button>
            )}
        </div>
      </div>
      
      {(simulationState === 'running' || simulationState === 'completed') && (
        <div className="mt-10 animate-fade-in">
          <h4 className="font-bold text-slate-700 text-sm mb-4 px-1 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
            3. 実行結果・分析レポート
          </h4>
           {simulationState === 'running' && (
                <div className="flex flex-col items-center justify-center py-12 bg-sky-50/50 rounded-2xl border border-sky-100 mb-6">
                    <LoadingIcon className="h-10 w-10 text-sky-600 mb-3" />
                    <p className="text-sm font-black text-sky-700">実行中: {progress.scenarioName}</p>
                    <p className="text-[10px] font-bold text-sky-500 mt-1 uppercase tracking-widest">{progress.current} / {progress.total} SCENARIOS PROCESSED</p>
                </div>
           )}
           <div className="space-y-4">
               {results.map((res, idx) => (
                   <details key={idx} className="border-2 border-slate-100 rounded-2xl bg-white overflow-hidden group shadow-sm hover:border-slate-200 transition-all" open={results.length === 1}>
                       <summary className="p-5 font-black text-slate-700 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none">
                           <div className="flex items-center gap-3">
                               <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] flex items-center justify-center font-mono">{idx + 1}</span>
                               <span className="text-sm tracking-tight">{getFuzzy(res.scenario, idx).name}</span>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${res.error ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                   {res.error ? 'FAILED' : 'COMPLETED'}
                               </span>
                               <svg className="w-4 h-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                           </div>
                       </summary>
                       <div className="p-6 bg-white border-t border-slate-50 space-y-5">
                           <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 relative">
                               <h5 className="text-[9px] font-black text-sky-600 mb-2 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                   <SparklesIcon className="w-3 h-3" /> AI ANALYSIS REPORT
                               </h5>
                               <p className="text-[13px] text-slate-700 Kal font-bold">{res.analysis}</p>
                           </div>
                           <div className="space-y-3">
                               <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-1.5">
                                   <ChatBubbleLeftRightIcon className="w-3 h-3" /> FULL TRANSCRIPT
                               </h5>
                               <div className="text-[12px] font-medium bg-slate-50 p-5 rounded-2xl max-h-64 overflow-y-auto custom-scrollbar border border-slate-100 space-y-3">
                                   {res.transcript.map((t, tidx) => (
                                       <div key={tidx} className="flex gap-2">
                                           <span className={`font-black whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] h-fit ${t.speaker === 'AI Customer' ? 'bg-slate-200 text-slate-500' : 'bg-sky-100 text-sky-600'}`}>
                                               {t.speaker === 'AI Customer' ? '顧客' : '担当'}
                                           </span>
                                           <span className="text-slate-600 leading-snug">{t.text}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   </details>
               ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousSimulator;