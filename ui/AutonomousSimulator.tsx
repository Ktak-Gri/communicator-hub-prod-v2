
import React from 'react';
import { Scenario, MasterSetting } from '../types.ts';
import { useAutonomousSimulator } from '../hooks/useAutonomousSimulator.ts';
import { LoadingIcon, PlayIcon, SparklesIcon } from './Icons.tsx';

interface Props {
  scenarios: Scenario[];
  masterSettings: MasterSetting[];
  adminToken: string | null;
  apiKey: string | null;
}

const AutonomousSimulator: React.FC<Props> = ({ scenarios }) => {
  const { selectedIds, setSelectedIds, isBusy, results, progress, run } = useAutonomousSimulator(scenarios);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 shadow-inner">
        <h3 className="text-xl font-black mb-4 flex items-center gap-3">
          <SparklesIcon className="text-sky-500 h-6 w-6" /> 
          AI自律対話シミュレーション
        </h3>
        <p className="text-sm font-bold text-slate-500 mb-6 px-1">AI同士を対話させ、コミュニケーター役の応答品質を自動でチェックします。</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto mb-8 bg-white/50 p-4 rounded-3xl border border-slate-100 custom-scrollbar">
          {scenarios.map(s => (
            <label key={s.id} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${selectedIds.includes(s.id) ? 'border-sky-500 bg-sky-50 text-sky-700' : 'bg-white border-white hover:border-slate-200'}`}>
              <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
              <span className="truncate">{s.name}</span>
            </label>
          ))}
        </div>
        
        <button onClick={run} disabled={isBusy || selectedIds.length === 0} className="w-full bg-sky-600 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-sky-700 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-3 transform active:scale-95">
          {isBusy ? <><LoadingIcon className="h-6 w-6" /><span>AI解析中 ({progress}%)</span></> : <><PlayIcon className="h-6 w-6" /><span>シミュレーションを開始</span></>}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((res, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-800 text-lg">{res.scenario.name}</h4>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">判定完了</span>
            </div>
            <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-100 mb-4">
              <h5 className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <SparklesIcon className="h-3 w-3" /> 解析レポート
              </h5>
              <p className="text-sm text-slate-700 font-bold leading-relaxed">{res.analysis}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AutonomousSimulator;
