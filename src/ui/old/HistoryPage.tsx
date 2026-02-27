
import React, { useState, useEffect, useCallback } from 'react';
import { Center, Scenario } from '../types.ts';
import { LoadingIcon, ArrowLeftIcon } from './Icons.tsx';
import FeedbackModal from './FeedbackModal.tsx';
import TestResultModal from './TestResultModal.tsx';
import { requestWithJsonp } from '../api.ts';

const processRawLogs = (rawData: { rows: any[] }, type: string): any[] => {
    if (!rawData || !Array.isArray(rawData.rows)) return [];
    return rawData.rows.map(log => ({
        ...log,
        traineeName: log.研修生名 || log.研修生 || log.traineeName || "",
        center: log.センター || log.center || "",
        timestamp: log.実施日時 || log.timestamp || log.startTime || "",
        scenarioName: log.シナリオ名 || log.scenarioName || log.questionText || "実施記録"
    }));
};

interface HistoryPageProps {
  traineeName: string;
  center: Center | null;
  scenarios: Scenario[];
  onBack: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ traineeName, center, scenarios, onBack }) => {
  const [activeTab, setActiveTab] = useState<'roleplay' | 'test'>('roleplay');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    const action = activeTab === 'roleplay' ? 'getUserHistoryRolePlay' : 'getUserHistoryTest';
    try {
      const { data } = await requestWithJsonp(action, { traineeName, center });
      setHistory(processRawLogs(data, activeTab));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [traineeName, center, activeTab]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="mb-2 flex flex-row items-center">
          <button onClick={onBack} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all whitespace-nowrap group px-2">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span className="leading-none">← 戻る</span>
          </button>
      </div>

      <div className="flex border-b border-slate-200">
        {['roleplay', 'test'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold transition-colors ${activeTab === tab ? 'border-b-4 border-sky-500 text-sky-600' : 'text-slate-400'}`}
          >
            {tab === 'roleplay' ? 'ロールプレイ履歴' : '知識テスト履歴'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><LoadingIcon className="h-8 w-8 text-sky-500" /></div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-[10px] font-black text-slate-400 font-mono">{log.timestamp}</p>
                  <p className="font-bold text-slate-800">{log.scenarioName}</p>
                </div>
                <button onClick={() => setSelectedLog(log)} className="bg-sky-100 text-sky-700 font-black px-4 py-1.5 rounded-xl text-xs">詳細</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400"><p>記録がありません</p></div>
        )}
      </div>
      {selectedLog && activeTab === 'roleplay' && <FeedbackModal feedback={selectedLog} onClose={() => setSelectedLog(null)} />}
      {selectedLog && activeTab === 'test' && <TestResultModal result={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};

export default HistoryPage;
